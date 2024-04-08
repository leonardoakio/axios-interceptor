import axios from "axios";
import Cookies from 'js-cookie';

const frontURL = "http://localhost:8081/";
const baseURL = "http://localhost:8080/";

const api = axios.create({
   baseURL: baseURL,
});

api.interceptors.request.use(async req => {
   let accessToken = Cookies.get('access_token') || null;
   let refreshToken = localStorage.getItem('refresh_token') || null;

   if (req.url === 'api/v1/credentials/refresh-token') {
      return req; // Deixa seguir o fluxo de renovação de token
   }

   if (req.url === 'api/v1/credentials/login') {
      return req; // Deixa seguir o fluxo de renovação de token
   }

   if (!accessToken || accessToken === 'undefined') {
      if (!refreshToken || refreshToken === 'undefined') {
         window.location.href = `${frontURL}invoice`;
         return req;
      }

      const isRefreshTokenExpired = (refreshToken) => {
         const decodedToken = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
         return Date.now() >= decodedToken.exp * 1000;
      };

      if (isRefreshTokenExpired) {
         window.location.href = `${frontURL}invoice`;
         return req;
      }

      const response = await api.post(`api/v1/credentials/refresh-token`, {
         refresh_token: refreshToken
      });

      localStorage.setItem('refresh_token', response.data.refresh_token)
      Cookies.set('access_token', response.data.access_token, { expires: new Date(Date.now() + 5 * 60 * 1000) });
   }

   if (!refreshToken) {
      window.location.href = `${frontURL}invoice`;
      return req;
   }

   // eslint-disable-next-line require-atomic-updates
   req.headers.Authorization = `Bearer ${accessToken}`; // Define Authorization antes de retornar req
   return req;
});

export default api;
