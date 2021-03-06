import React, {
  useState,
  useRef,
  useEffect,
  useContext,
} from 'react';
import { cn } from '@bem-react/classname';
import moment from 'moment';
import AuthContext from '../../../../../../../context/authContext';
import CommentsContext from '../../../../../../../context/commentsContext';
import './ReplyComment.css';

const superagent = require('superagent');

const ReplyComment = ({ cls, parentId, setHidden }) => {
  const [comment, setComment] = useState('');
  const commentCss = cn('ReplyComment');
  const { dispatch, imdbId } = useContext(CommentsContext);
  const { stateAuthReducer } = useContext(AuthContext);
  const input = useRef(null);
  useEffect(() => {
    input.current.focus();
  }, []);
  const addComment = () => {
    superagent.post('/api/comment/add').send({
      user_id: stateAuthReducer.user.userId,
      text: comment,
      movie_id: imdbId,
      parent_id: parentId,
    }).then((res) => {
      const { id } = res.body;
      dispatch({
        type: 'ADD_COMMENT',
        comment: {
          id,
          user_id: stateAuthReducer.user.userId,
          parent_id: parentId,
          login: stateAuthReducer.user.username,
          created_at: moment(),
          text: comment,
          photo: stateAuthReducer.user.photo,
        },
      });
    }).catch((e) => console.log(e));
    setComment('');
    setHidden(true);
  };
  return (
    <div className={cls('ReplyComment')}>
      <textarea
        ref={input}
        className={commentCss('Textarea')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        name="comment"
      />
      <button
        onClick={addComment}
        disabled={comment === ''}
        className={commentCss('Button')}
      >
        <span className="material-icons">
          arrow_right_alt
        </span>
      </button>
    </div>
  );
};

export default ReplyComment;
