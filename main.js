// ==UserScript==
// @name         New Userscript
// @namespace    https://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.roblox.com/discover#/sortName/v2/Favorites
// @icon         https://www.google.com/s2/favicons?sz=64&domain=roblox.com
// @grant        none
// ==/UserScript==

const Body = document.getElementsByClassName("html")[0].getElementsByClassName("body")[0]
const Container = Body.getElementFromId("wrap").getElementFromId("container-main")
const FavoritesContainer = Container.getElementByClassName("content")[0].getElementFromId("favorites-container")
const AssetsExplorer = FavoritesContainer.getElementByClassName("row page-content").getElementFromType("assets-explorer")
const CurrentItems = AssetsExplorer.FirstChild.getElementByClassName("tab-content-group").getElementByClassName("tab-content rbx-tab-content").getElementByClassName("current-items")
const List = CurrentItems.getElementFromId("assetsItems")

function CreateItemContainer(Title, URL, ImageURL, ID){
    const div = List.createElement("div")
    div.class = "grid-item-container game-card-container"
    div["data-testid"] = "game-title"
      
    const GameCardLink = div.createElement("a")
    GameCardLink.class = "game-card-link"
    GameCardLink.href = URL
    GameCardLink.id = ID
      
    const Thumbnail = GameCardLink.createElement("span")
    Thumbnail.class = "thumbnail-2d-container game-card-thumbnail-container"
    
    const ThumbnailImage = Thimbnail.createElement("img")
    ThumbnailImage.src = ImageURL
    ThumbnailImage  .alt = Title
    ThumbnailImage.title = Title
      
    const TitleDiv = GameCardLink.createElement("div")
    TitleDiv.class = "game-card-name game-name-title"
    TitleDiv.title = Title
    TitleDiv.data = Title
      
    return div
  }
  
  function ParsePage(Page){
      const Data = Page?.Data
      const Items = Data?.Items

      if (!Items) {
        return true
      }

      if (Items.length == 0 ){
        return true
      }

      for (let i = 0; i < Items.length; i++){
        const Item = Items[i]
        const Place = Item.Item

        CreateItemContainer(Place.Name, Place.AbsoluteURL, Place.Thumbnail.Url, Place.AssetId.toString())
      }
  }
  
  function Request(URL, Method){
      https://www.roblox.com/users/favorites/list-json?assetTypeId=9&itemsPerPage=100&pageNumber=2&userId=51787703
      
      fetch(URL, {method: Method})
  }
  
  function StartLoop(PageNumber, UserId){
      const Data = Request(`https://www.roblox.com/users/favorites/list-json?assetTypeId=9&itemsPerPage=100&pageNumber=${PageNumber}&userId=${UserId}`)
      if (ParsePage(Data)) {
        return
      }
      
      StartLoop(PageNumber + 1)
  }
  
  StartLoop(1)