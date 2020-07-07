import React, { useEffect } from 'react';
import { cn } from '@bem-react/classname';
import { useParams } from 'react-router-dom';
import { animateScroll as scroll } from 'react-scroll';
import MovieInfo from './MovieInfo/MovieInfo';
import useGetMovieInfo from '../../../services/useGetMovieInfo';
import useGetMovieSuggestions from '../../../services/useGetMovieSuggestions';
import MovieSuggestions from './MovieSuggestions/MovieSuggestions';
import MovieComments from './MovieComments/MovieComments';
import useGetMovieTorrents from '../../../services/useGetMovieTorrents';
import MovieVideo from './VideoBox/VideoBox';
import MovieInfoContext from '../../../context/MovieInfoContext';

const MoviePage = () => {
  const { imdbId, ytsId } = useParams();
  const moviePageCss = cn('MoviePage');
  useEffect(() => {
    scroll.scrollToTop();
  }, [imdbId]);
  const { errorOMDB, OMDBInfo } = useGetMovieInfo(imdbId);
  const { errorSuggestions, movieSuggestions } = useGetMovieSuggestions(ytsId);
  const { errorYTS, YTSInfo } = useGetMovieTorrents(ytsId);
  const isReady = OMDBInfo && YTSInfo && movieSuggestions.length > 0;
  const isError = errorOMDB || errorYTS;
  return (
    <MovieInfoContext.Provider value={{ YTSInfo, OMDBInfo }}>
      {errorSuggestions && <div>Error suggestions</div>}
      {isError && <div>An error occurred. Please refresh the page</div>}
      {isReady && <MovieInfo cls={moviePageCss} />}
      {isReady && <MovieVideo cls={moviePageCss} />}
      {isReady && <MovieSuggestions movies={movieSuggestions} />}
      {isReady && <MovieComments title={OMDBInfo.Title} imdbId={imdbId} />}
    </MovieInfoContext.Provider>
  );
};

export default MoviePage;
