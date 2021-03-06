import React, { useContext, useState } from 'react';
import he from 'he';
import { cn } from '@bem-react/classname';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { scroller } from 'react-scroll';
import AuthContext from '../../context/authContext';
import useGetUserInfo from '../../services/useGetUserInfo';
import './Profile.css';
import UpdateProfile from './UpdateProfile/UpdateProfile';

const superagent = require('superagent');

const Profile = () => {
  const { userId } = useParams();
  const profileCss = cn('Profile');
  const { stateAuthReducer } = useContext(AuthContext);
  const isUserProfile = Number(userId) === stateAuthReducer.user.userId;
  const { user } = useGetUserInfo(userId, isUserProfile);
  const [hiddenInput, setHiddenInput] = useState(false);
  const [passwdInput, setPasswdInput] = useState('');
  const [passwdCheck, setPasswdCheck] = useState(0);
  const [isError, setIsError] = useState(false);
  const changeHiddenInput = () => {
    if (user.githubid || user.googleid || user.fortytwoid || user.spotifyid || user.vkid) {
      setPasswdCheck(2);
    } else {
      setHiddenInput((hidden) => !hidden);
    }
  };
  const { t } = useTranslation();
  function scrollTo() {
    scroller.scrollTo('scroll-to-element', {
      duration: 1000,
      delay: 0,
      smooth: 'easeInOutQuart',
    });
  }
  const checkPassword = (e) => {
    e.preventDefault();
    superagent.post('/api/auth/validatePass').send({
      user_id: stateAuthReducer.user.userId,
      password: passwdInput,
    })
      .then((res) => {
        if (!res.body.isValid) {
          setPasswdCheck(1);
        } else {
          setPasswdCheck(2);
          scrollTo();
        }
      })
      .catch(() => setIsError(true));
  };
  return (
    <div className={profileCss()}>
      <div className={profileCss('Box')}>
        {!user && (<span>{t('profile.userError')}</span>)}
        {isError && (<span>{t('profile.serverError')}</span>)}
        {user && (
          <div>
            {user.photo && <img className={profileCss('Avatar')} src={`/api/public/photo/${user.photo}`} alt="User" />}
            <div className={profileCss('Login')}>{user.login}</div>
            {user.info && (<div className={profileCss('Info')}>{he.decode(user.info)}</div>)}
            {user.first_name && user.last_name && (<div className={profileCss('Name')}>{`${he.decode(user.first_name)} ${he.decode(user.last_name)}`}</div>)}
          </div>
        )}
        {user && isUserProfile && (
          <div>
            <button onClick={changeHiddenInput} className={profileCss('ChangeButton')}>
              <span className={profileCss('ButtonText')}>{t('profile.edit')}</span>
              <span className={profileCss('ButtonText', ['material-icons'])}>lock</span>
            </button>
            {hiddenInput && (
              <div>
                <form>
                  <input
                    /* eslint-disable-next-line jsx-a11y/no-autofocus */
                    autoFocus
                    autoComplete="password"
                    className={profileCss('Input')}
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    value={'' || passwdInput}
                    onChange={(e) => {
                      setPasswdInput(e.target.value);
                    }}
                  />
                  <button onClick={(e) => checkPassword(e)} className={profileCss('InputButton')}>
                    <span className="material-icons">
                      arrow_right_alt
                    </span>
                  </button>
                </form>
                {passwdCheck === 1 && <div className={profileCss('InputError')}>{t('profile.passwordError')}</div>}
              </div>
            )}
          </div>
        )}
        {passwdCheck === 2 && <UpdateProfile cls={profileCss} user={user} />}
      </div>
    </div>
  );
};

export default Profile;
