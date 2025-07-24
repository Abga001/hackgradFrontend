const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
  },
  production: {
    // Updated to point to your Azure App Service backend
    apiUrl: 'https://hackgrad.azurewebsites.net/api',
  }
};

const env = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
  ? 'production'
  : 'development';

export default config[env];