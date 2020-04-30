import React, { useContext } from 'react';
import { cn } from '@bem-react/classname';
import './Genre.css';
import MoviesContext from '../../../../../context/moviesContext';
import GenresContext from '../../../../../context/genresContext';

const Genre = (props) => {
  const { genre, index } = props;
  const { type, name } = genre;
  const { dispatch } = useContext(MoviesContext);
  const { setVisible, setGenreIndex } = useContext(GenresContext);
  const genreCss = cn('Genre');
  const handleChooseGenre = () => {
    dispatch({ type: 'ADD_QUERY', query: { genre: type } });
    setGenreIndex(index);
    setVisible(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={genreCss()}
      onClick={handleChooseGenre}
      onKeyDown={(e) => {
        if (e.code === 'KeyE') {
          handleChooseGenre();
        }
      }}
    >
      <img src={`/genre_images/${type}.png`} alt="Genre poster" className={genreCss('Image')} />
      <span className={genreCss('Title')}>{name}</span>
    </div>
  );
};

export default Genre;
