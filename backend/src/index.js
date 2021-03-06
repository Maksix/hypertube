/* eslint-disable */
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const http = require('http');
const sock = require('socket.io');
const router = require('./routes');
const {
  localStrategy,
  googleStrategy,
  fortytwoStrategy,
  githubStrategy,
  vkontakteStrategy,
  spotifyStrategy,
} = require('./config/passport-config');
const TorrentClient = require('./TorrentClient/TorrentClient');
const Stream = require('./Stream/Stream');
const Cron = require('../cron/Cron');

passport.use('local', localStrategy);
passport.use('google', googleStrategy);
passport.use('42', fortytwoStrategy);
passport.use('github', githubStrategy);
passport.use('vkontakte', vkontakteStrategy);
passport.use('spotify', spotifyStrategy);
const app = express();
app.use(cors());
const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = sock(server);
app.use('/public', express.static(path.resolve(__dirname, '../public')));
app.use('/video', express.static(path.resolve(__dirname, '../video')));

app.use(session({
  secret: 'hypertube',
  saveUninitialized: false,
  resave: false,
}));
app.use(express.json({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('serialize user', user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const torrents = [];
const streams = [];

io.on('connection', async (socket) => {
  const { movie } = socket.handshake.query;
  const { torrentFile } = socket.handshake.query;

  console.log(`Connected to: ${movie}`);

  if (!torrents[movie]) torrents[movie] = new TorrentClient('video');
  if (!streams[movie]) streams[movie] = new Stream();

  socket.join(movie);

  socket.on('play', async () => {
    if (torrents[movie].status === 'idle') {
      torrents[movie].initialize(torrentFile)
        .then(() => streams[movie].initialize(torrents[movie].files.path, torrents[movie].downloads))
        .then(() => streams[movie].createPlaylist())
        .then(() => {
          // const subtitlesFile = streams[movie].files.subtitles.length ? streams[movie].files.subtitles[0] : null;
          const subtitles = streams[movie].files.subtitles;
          if (subtitles.length) {
            return new Promise(async resolve => {
              for (const subtitle of subtitles) {
                await torrents[movie].download(subtitle);
              }
              resolve();
            });
          } else
            return Promise.resolve();
          // if (subtitlesFile) return torrents[movie].download(subtitlesFile);
        })
        .then(() => streams[movie].convertSubtitles())
        .then(() => {
          torrents[movie].events.on('piece-written', () => streams[movie].downloaded += torrents[movie].parser.BLOCK_SIZE);
          torrents[movie].events.on('files-checked', (size) => streams[movie].downloaded += size);
          torrents[movie].events.on('files-created', () => streams[movie].convertVideo());

          streams[movie].events.on('manifest-created', () => {
            socket.emit('stream', { path: streams[movie].path, playlist: streams[movie].playlist, subtitles: streams[movie].subtitles });
          });

          return torrents[movie].download(streams[movie].files.movie);
        })
        .then(() => {
          torrents[movie].events.removeAllListeners('piece-written');
          streams[movie].restart = false;
        })
        .catch((error) => {
          if (torrents[movie]) torrents[movie].close();
          if (streams[movie]) streams[movie].close();
          console.log(`emit error: ${error}`);
          socket.in(movie).emit('errors', error);
          // for some reason socket.in doesn't send to self
          socket.emit('errors', error);
        });
    } else if (streams[movie].ready) {
        socket.emit('stream', { path: streams[movie].path, playlist: streams[movie].playlist, subtitles: streams[movie].subtitles });
    } else {
      streams[movie].events.on('manifest-created', () => {
        socket.emit('stream', { path: streams[movie].path, playlist: streams[movie].playlist, subtitles: streams[movie].subtitles });
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnected');
    let roomie;
    const room = io.sockets.adapter.rooms[movie];

    if (room && room.length === 1) {
      roomie = Object.keys(room.sockets)[0];
    }

    if (room === undefined || roomie === socket.id) {
      if (torrents[movie]) {
        torrents[movie].close();
        torrents[movie].events.removeAllListeners('piece-written');
        torrents[movie].events.removeAllListeners('files-checked');
        torrents[movie].events.removeAllListeners('files-created');
      }
      if (streams[movie]) {
        streams[movie].close();
        streams[movie].events.removeAllListeners('manifest-created');
      }
    }
  });
});

app.use('/', router);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const cron = new Cron('video', 'hls.m3u8');
cron.cleanUp();
