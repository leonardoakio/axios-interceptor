import axios from "axios";
import Cookies from 'js-cookie';
import dayjs from 'dayjs';

const baseURL = import.meta.env.VITE_API_URL

const api = axios.create({
   baseURL: baseURL,
});

api.interceptors.request.use(async req => {
   let accessToken = Cookies.get('access_token') || null;
   let refreshToken = localStorage.getItem('refresh_token') || null;

   if (req.url === 'api/v1/refresh-token') {
      return req; // Deixa seguir o fluxo de renovação de token
   }

   if (req.url === 'api/v1/loading') {
      return req; // Deixa seguir o fluxo recebimento de authorization code
   }

   if (req.url === 'api/v1/access-token') {
      return req; // Deixa seguir fluxo de troca de tokens
   }

   if (!accessToken) {
      const refreshToken = localStorage.getItem('refresh_token') || null;

      if (!refreshToken) {
         window.location.href = `${baseURL}api/v1/auth-login`;
         return req;
      }

      //TODO Testar
      const isExpired = dayjs.unix(refreshToken.exp).isBefore(dayjs());
      if (isExpired) {
         window.location.href = `${baseURL}api/v1/auth-login`;
         return req;
      }

      const response = await api.post(`api/v1/refresh-token`, {
         refresh_token: refreshToken
      });

      console.log("newAccessToken: ", response.data.access_token)

      localStorage.setItem('refresh_token', response.data.refresh_token)
      Cookies.set('access_token', response.data.access_token, { expires: new Date(Date.now() + 5 * 60 * 1000) });

      accessToken = Cookies.get('access_token') || null; // Atualiza o accessToken
   }

   if (!refreshToken) {
      window.location.href = `${baseURL}api/v1/auth-login`;
      return req;
   }

   if (accessToken === 'undefined' || refreshToken === 'undefined') {
      window.location.href = `${baseURL}api/v1/auth-login`;
      return req;
   }

   // eslint-disable-next-line require-atomic-updates
   req.headers.Authorization = `Bearer ${accessToken}`; // Define Authorization antes de retornar req
   return req;
});

export default api;
