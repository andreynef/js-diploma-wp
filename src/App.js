import React, {useEffect, useState} from 'react';
import './main.global.css';
import Unsplash, {toJson} from 'unsplash-js';
import {CardList} from "./components/CardsList/CardList";
import {Route, Switch} from "react-router-dom";
import {Header} from "./components/Header/Header.js";
import {Footer} from "./components/Footer/Footer";
import {CardPage} from "./components/CardPage/CardPage";
import { disablePageScroll, enablePageScroll } from 'scroll-lock';


const App = () => {
  const accessKey = process.env.REACT_APP_ACCESSKEY;//ключ прячем в рут (файл .env) + плагин dotenv-webpack в клиентской части конфиг файла. + gitignore. В create-react-app автомат.
  const secret = process.env.REACT_APP_SECRET;
  const callbackUrl = process.env.REACT_APP_CALLBACKURL;
  const bearerToken = localStorage.accessTokenForUnsplash;//берем из локала. Если нет то устанавливается на null.
  // const bearerToken = 'u9cltpdaekYTys_6i6twxgdnLT2W69GbEPQVMYollUg';//Andrey
  const AMOUNT_ON_PAGE = 10;
  const INITIAL_PAGE = 100;
  const unsplash = new Unsplash({//с ключом или без неважно. Будет использоваться только один unsplash без обновлений.
    accessKey: accessKey,// accesskey из настроек вашего приложения
    secret: secret,// Application Secret из настроек вашего приложения
    callbackUrl: callbackUrl,// Полный адрес страницы авторизации приложения (Redirect URI). Важно: этот адрес обязательно должен быть указан в настройках приложения на сайте Unsplash API/Developers
    bearerToken: bearerToken,//берем из локала. Если нет то устанавливается null.
  });

  const [images, setImages] = useState([]);//стейт списка фоток
  const [clickedImageObj, setClickedImageObj] = useState({});//обьект на кот ткнули
  const [isCardOpened, setIsCardOpened] = useState(false);//стейт отображения картинки в подробном виде
  const [page, setPage] = useState(INITIAL_PAGE);//для слежки посл открытой страницы из запроса
  const [isAuth, setIsAuth] = useState(false);//статус авторизации
  const [userProfile, setUserProfile] = useState('');//информация о пользователе
  const [isHeartError, setIsHeartError] = useState(false);//информация о пользователе


  const devBtn =()=> {
    console.log('localStorage.accessTokenForUnsplash is:', localStorage.accessTokenForUnsplash);
    console.log('process.env.REACT_APP_ACCESSKEY:', process.env.REACT_APP_ACCESSKEY);
    // localStorage.setItem('accessTokenForUnsplash','u9cltpdaekYTys_6i6twxgdnLT2W69GbEPQVMYollUg');
  };

  const getBearerTokenFromUrlCode =()=> {
    console.log('getting code from url...');
    const codeFromUrl = window.location.search.split('code=')[1];// Считываем GET-параметр code из URL// www.example.com/auth?code=abcdef123456...

    if (codeFromUrl) {//если код в строке есть.
      console.log('check codeFromUrl:', codeFromUrl);
      unsplash.auth.userAuthentication(codeFromUrl)//отправляем запрос на получение токена
        .then(toJson)
        .then(json => {
          console.log('json answer from url is:', json);
          setBearerTokenToLocalStorage(json.access_token);
          console.log('set to local from getBearerTokenFromUrlCode is done');
          // setBearerToken(json.access_token);
          window.location.assign('https://jsdiploma.nef-an.ru');// Перезагружаем гл страницу.
          // console.log('setBearerToken from getBearerTokenFromUrlCode is done');
          console.log('reloading from getBearerTokenFromUrlCode is done');
        })
    }else{
      console.log('getting code is skipped. codeFromUrl is:',codeFromUrl);//return false
    }
  }

  const getUserProfile =()=> {
    console.log('getting UserProfile...bearerToken is:', bearerToken);
    if (bearerToken) {//если в стейте есть ключ
      console.log('your app already has tokenAccess key! Sending request...');
      unsplash.currentUser.profile()
        .then(toJson)
        .then(json => {// json обьект = {id: "Rc7GH-2FKsU", name: "andrey nefedyev", first_name: "andrey"}
          console.log('json profile answer is:', json);
          setUserProfile(json);
          console.log('setting UserProfile to state is done');
          setIsAuth(true);
          console.log('setIsAuth from getUserProfile is done');
        });
    }
    else {//иначе с вещами на вылет.
      console.log('getting UserProfile from server is skipped.  bearerToken is:', bearerToken);
    }
  };

  const setBearerTokenToLocalStorage= (bearerToken) => {
    localStorage.setItem('accessTokenForUnsplash', JSON.stringify(bearerToken));
  };

  const deleteAccessTokenFromLocalStorage= () => {
    localStorage.removeItem('accessTokenForUnsplash');
  };

  const toLogout= () => {
    setIsAuth(false);
    deleteAccessTokenFromLocalStorage();
  };

  const goToAuthorizePage=()=>{
    const authenticationUrl = unsplash.auth.getAuthenticationUrl([// Генерируем адрес страницы аутентификации на unsplash.com
      "public",// и указываем требуемые разрешения (permissions)
      "write_likes",
    ]);
    window.location.assign(authenticationUrl);// Отправляем пользователя на авторизацию сайта Unsplash а потом он пепенаправит пользователя на - callbackUrl: "https://jsdiploma.nef-an.ru/auth"
  };

  const getFirstTenPhotos = ()=>{
    console.log('getting 10 photos...')
    if (images.length === 0) {//только когда список пуст.
      unsplash.photos.listPhotos(page, AMOUNT_ON_PAGE, "latest")// метод из библиотеки https://github.com/unsplash/unsplash-js#photos. photos.listPhotos(page, perPage, orderBy)
        .then(toJson)
        .then(json => {//json это ответ в виде массива обьектов
          setImages([...json]);//установка нов стейта списка фоток (после этой ф).
          console.log('getting 10 photos is done')
        });
    }else {
      console.log('getting 10 photos is skipped. images.length is:', images.length)
    }

  };

  const addPhotos = () => {
    unsplash.photos.listPhotos(page+1, AMOUNT_ON_PAGE, "latest")// метод из библиотеки https://github.com/unsplash/unsplash-js#photos. photos.listPhotos(page, perPage, orderBy)
      .then(toJson)
      .then(json => {//json это ответ в виде массива обьектов в количестве указанном в переменной amountOfItemsOnPage.
        const newImagesArr = [...images, ...json];//создаем новый массив добавляя к старым новые фотки.
        // const newCleanArr = [...new Set(newDirtyArr)];//избавляемся от дублирования элементов. ES6. Альтернатива Array.from(new Set (newDirtyArr))
        // const newCleanArr2 = newDirtyArr.filter((item,index)=>newDirtyArr.indexOf(item===index));//способ 2 через filter
        // const newCleanArr3 = newDirtyArr.reduce((unique,item)=>unique.includes((item) ? unique:[...unique, item], []));//способ 3 через reduce
        setImages(newImagesArr);//обновляем стейт списка картинок.
        setPage(page + 1);//сохраняем стейт последней запрашиваемой страницы.
      });
  };

  const likePhotoRequest =(id)=> {
    unsplash.photos.likePhoto(id)// метод из библиотеки https://github.com/unsplash/unsplash-js#photos
      .then(toJson)
      .then(json => {//json это ответ в виде одного обьекта {photo:{}, user:{}}
        //ничего не делать чтобы не нагружать сервер лишними запросами на загрузку.
      })
  };

  const unlikePhotoRequest =(id)=> {
    unsplash.photos.unlikePhoto(id)// метод из библиотеки https://github.com/unsplash/unsplash-js#photos
      .then(toJson)
      .then(json => {//json это ответ в виде одного обьекта {photo:{}, user:{}}
        //ничего не делать чтобы не нагружать сервер лишними запросами на загрузку.
      })
  };

  const handleClickPreview = (id) => {//повешен на preview
    console.log(`preview is clicked. getting image obj...id:`, id);
    const clickedObj = images.find(item => item.id === id);//найти итем с нужным айди в стейте
    console.log(`clickedImageObj is:`, clickedObj);
    setClickedImageObj(clickedObj);//установить стейт открытой картинки, кот потом будет передавать всю инфу при детальном просмотре.
    console.log(`setClickedImageObj is done`);
    setIsCardOpened(true);//установить стейт булинь статуса открытости картинки
    console.log(`setIsDone is done - end of handleClickPreview function. `);
  };

  const handleClickHeart = (id) => {
    console.log('heart is clicked. getting image obj...id:', id);
    const clickedObj = images.find(item => item.id === id);//найти итем с нужным айди в стейте
    setClickedImageObj(clickedObj);//установить стейт открытой картинки, кот потом будет передавать всю инфу при детальном просмотре.
    const clickedObjLikesAmount = clickedObj.likes;//вытащить число лайков из обьекта для дальнейшего их изменения ниже.

    if(isAuth) {
      console.log('heartClick is in process... isAuth is:', isAuth)
      if (clickedObj.liked_by_user === false) {//если у выбранного итема стоит like=false...
        likePhotoRequest(id);//...то запрос на сервер на лайк.
        const localFilteredImages = images.filter(item =>//создать копию стейта списка изменяя нужные данные у одного выбранного элемента
          item.id === id
            ? (item.liked_by_user=true, item.likes=clickedObjLikesAmount+1)
            : item
        );
        setImages(localFilteredImages);//установить нов фильтрованый список с измененным итемом.
      } else {//иначе, тобишь true...
        unlikePhotoRequest(id);//...запрос на сервер на анлайк
        const localFilteredImages = images.filter(item =>//создать копию стейта списка изменяя нужные данные у одного выбранного элемента
          item.id === id
            ? (item.liked_by_user=false, item.likes=clickedObjLikesAmount-1)
            : item
        );
        setImages(localFilteredImages);//установить нов фильтрованый список с измененным итемом.
      };
    }else{
      console.log('heartClick failed. isAuth is:', isAuth);
      setIsHeartError(true);
      setTimeout(()=>setIsHeartError(false), 2000);
    };
  }

  const toggleScroll = ()=>{
    if(isCardOpened){
      disablePageScroll();
    }else{
      enablePageScroll();
    }
  }


  useEffect(() => {
    getBearerTokenFromUrlCode();//is it auth url? true  -> setBearerTokenToLocalStorage and reload.
    getUserProfile();//is unsplash has code? true -> setUserProfile,setIsAuth.
    getFirstTenPhotos();//are images empty? true  -> setImages.
  }, []);//= componentDidMount, componentWillUpdate. Выполняется 1 раз при монтаже и кажд раз при изменении []. Если в [] пусто то просто 1 раз при монтаже.

  useEffect(() => {
    toggleScroll();
  }, [isCardOpened]);//is isCardOpened changed? -> disablePageScroll/enablePageScroll.


  return (
    <>
      <Header
        goToAuthorizePage={goToAuthorizePage}
        toLogout={toLogout}
        isAuth={isAuth}
        userProfile={userProfile}
        devBtn={devBtn}
      />
      <Switch>{/*рендерится в зависимости от Route path*/}
        <Route exact path={'/'}
               component={() =>
                 <CardList
                   add={addPhotos}
                   handleClickHeart={handleClickHeart}
                   images={images}
                   handleClickPreview={handleClickPreview}
                   isAuth={isAuth}
                   isHeartError={isHeartError}
                   setIsHeartError={setIsHeartError}
                   clickedImageObj={clickedImageObj}
                 />}
        />
        <Route exact path={'/auth'} component={() => <Auth unsplash={unsplash}/>}/>
      </Switch>
      <CardPage
        clickedImageObj={clickedImageObj}
        handleClickHeart={handleClickHeart}
        images={images}
        isAuth={isAuth}
        setIsCardOpened={setIsCardOpened}
        isCardOpened={isCardOpened}
      />
      <Footer isCardOpened={isCardOpened}/>

    </>
  );

}

export default App;
