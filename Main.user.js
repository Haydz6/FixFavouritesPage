// ==UserScript==
// @name         Fix Favourites Page
// @version      1.0
// @description  Fixes the favourite page on roblox
// @author       Haydz6
// @match        https://www.roblox.com/discover*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=roblox.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

const UserId = document.head.querySelector("[name~=user-data][data-userid]").getAttribute("data-userid")
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ReachedEnd = false
let IsLoading = false
let CurrentPage = 0

function IsFavouritePage(){ //We have to do this as @match does not support # in url
  return window.location.href.indexOf("sortName/v2/Favorites") > -1
}

if (!IsFavouritePage()) return

async function WaitForClass(ClassName){
  let Element = null

  while (true) {
    Element = document.getElementsByClassName(ClassName)[0]
    if (Element != undefined) {
      break
    }

    await sleep(50)
  }

  return Element
}

const List = await WaitForClass("game-grid")

function CreateItemContainer(Title, URL, ImageURL, ID, LikeRatio, Players){
  const div = document.createElement("div")
  div.className = "grid-item-container game-card-container"
  div.setAttribute("data-testid", "game-title")

  const GameCardLink = document.createElement("a")
  GameCardLink.className = "game-card-link"
  GameCardLink.href = URL
  GameCardLink.id = ID

  const Thumbnail = document.createElement("span")
  Thumbnail.className = "thumbnail-2d-container game-card-thumb-container"

  const ThumbnailImage = document.createElement("img")
  ThumbnailImage.src = ImageURL
  ThumbnailImage.alt = Title
  ThumbnailImage.title = Title

  const TitleDiv = document.createElement("div")
  TitleDiv.className = "game-card-name game-name-title"
  TitleDiv.title = Title
  TitleDiv.innerText = Title

  const GameCardInfo = document.createElement("div")
  GameCardInfo.className = "game-card-info"
  
  const IconVotesGray = document.createElement("span")
  IconVotesGray.className = "info-label icon-votes-gray"
  
  const VotePercentageLabel = document.createElement("span")
  VotePercentageLabel.className = "info-label vote-percentage-label"
  VotePercentageLabel.innerText = LikeRatio && LikeRatio+"%" || "--"
  
  const IconPlayingGray = document.createElement("span")
  IconPlayingGray.className = "info-label icon-playing-counts-gray"
  
  const PlayingCountsLabel = document.createElement("span")
  PlayingCountsLabel.className = "info-label playing-counts-label"
  PlayingCountsLabel.innerText = Players >= 1000 && `${Math.floor(Players/100)/10}K` || Players || Players == 0 && "0" || "--"

  GameCardInfo.appendChild(IconVotesGray)
  GameCardInfo.appendChild(VotePercentageLabel)
  GameCardInfo.appendChild(IconPlayingGray)
  GameCardInfo.appendChild(PlayingCountsLabel)

  div.appendChild(GameCardLink)

  GameCardLink.appendChild(Thumbnail)
  GameCardLink.appendChild(TitleDiv)
  GameCardLink.appendChild(GameCardInfo)

  Thumbnail.appendChild(ThumbnailImage)
  
  List.appendChild(div)

  return div
}

async function RequestFunc(URL, Method){
  return await (await fetch(URL, {method: Method})).json()
}

function Convert110pxTo150pxImageURL(URL){
  return URL.replace("110/110", "150/150")
}

async function GetUniversesLikes(Universes){
  let URL = "https://games.roblox.com/v1/games/votes?universeIds="
  let UniverseIds = ""

  for (let i = 0; i < Universes.length; i++){
    if (i > 0) {
      UniverseIds = `${UniverseIds}%2C`
    }
    UniverseIds = `${UniverseIds}${Universes[i]}`
  }

  const Data = (await RequestFunc(URL+UniverseIds, "GET"))?.data

  if (!Data) return

  const Lookup = {}

  for (let i = 0; i < Data.length; i++){
    const Item = Data[i]
    Lookup[Item.id] = Item
  }

  return Lookup
}

async function GetUniversesInfo(Universes){
  let URL = "https://games.roblox.com/v1/games?universeIds="
  let UniverseIds = ""

  for (let i = 0; i < Universes.length; i++){
    if (i > 0) {
      UniverseIds = `${UniverseIds}%2C`
    }
    UniverseIds = `${UniverseIds}${Universes[i]}`
  }

  const Data = (await RequestFunc(URL+UniverseIds, "GET"))?.data

  if (!Data) return

  const Likes = await GetUniversesLikes(Universes)
  const Lookup = {}

  for (let i = 0; i < Data.length; i++){
    const Item = Data[i]
    Lookup[Item.id] = Item

    if (Likes){
      const LikeItem = Likes[Item.id]
      Item.LikeRatio = Math.floor((LikeItem.upVotes / (LikeItem.upVotes+LikeItem.downVotes))*100)
    }
  }

  return Lookup
}

async function ParsePage(Page){
  const Data = Page?.Data
  const Items = Data?.Items

  if (!Items) {
    return true
  }

  if (Items.length == 0 ){
    return true
  }

  const Universes = []

  for (let i = 0; i < Items.length; i++){
    Universes.push(Items[i].Item.UniverseId)
  }

  const UniversesInfo = await GetUniversesInfo(Universes)

  for (let i = 0; i < Items.length; i++){
    const Item = Items[i]
    const Place = Item.Item

    const Info = UniversesInfo?.[Place.UniverseId]

    CreateItemContainer(Place.Name, Place.AbsoluteUrl, Convert110pxTo150pxImageURL(Item.Thumbnail.Url), Place.AssetId.toString(), Info?.LikeRatio, Info?.playing)
  }
}

async function GetPage(){
  if (ReachedEnd || IsLoading) return

  IsLoading = true
  CurrentPage += 1

  const Data = await RequestFunc(`https://www.roblox.com/users/favorites/list-json?assetTypeId=9&itemsPerPage=100&pageNumber=${CurrentPage}&userId=${UserId}`)

  if (await ParsePage(Data)) {
    ReachedEnd = true
  }

  IsLoading = false
}

await WaitForClass("grid-item-container game-card-container")

List.replaceChildren()
GetPage()

window.onscroll = function(){
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    GetPage()
  }
}