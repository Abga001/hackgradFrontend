const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
  },
  production: {
    apiUrl: 'https://hackgrad-evd0c6g9agehf9e5.canadacentral-01.azurewebsites.net/api',
  }
};

const env = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
  ? 'production'
  : 'development';

export default config[env];