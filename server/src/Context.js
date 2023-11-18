import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export const NoteContext = createContext();

function NoteProvider({ children }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [userId, setUserId] = useState(
    JSON.parse(localStorage.getItem('userId') || null)
  );

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('username') || null)
  );

  const getData = async () => {
    try {
      const response = await axios.get('http://localhost:8080', {
        headers: {
          authorization: userId,
        },
      });
      setData(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      if (userId !== null) {
        await getData();
      }
    };

    fetchData();
  }, [userId, setData]);

  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/delete/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  const handleInputChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value, userId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/create', note);
      console.log(response.data);
      setNote({ id: null, title: '', description: '', userId: userId });
      await getData();
      navigate('/');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const [error, setError] = useState('');

  const Login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8080/login', {
        username,
        password,
      });
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError('');

        console.log('Logged in successfully:', response.data);
        setCurrentUser(response.data.user.username);
        setUserId(response.data.user.id);

        Cookies.set('token', response.data.token, {
          expires: 1,
        });
        localStorage.setItem(
          'username',
          JSON.stringify(response.data.user.username)
        );
        localStorage.setItem('userId', JSON.stringify(response.data.user.id));

        await getData();

        navigate('/');
        // console.log(JSON.parse(localStorage.getItem('username')));

        // console.log('jwt:', response.data.token);
      }
    } catch (error) {
      setError('Please enter the valid credentials again.');
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setCurrentUser(null);
    navigate('/login');
  };
  setTimeout(() => {
    handleLogout();
  }, 24 * 60 * 60 * 1000);

  return (
    <NoteContext.Provider
      value={{
        getData,
        data,
        isLoading,
        onDelete,
        handleInputChange,
        handleSubmit,
        note,
        setNote,
        currentUser,
        Login,
        error,
        handleLogout,
        userId,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export default NoteProvider;