import fetch from "node-fetch";
import { Client } from "discord.js";
import { GatewayIntentBits } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { AttachmentBuilder } from "discord.js"
import collections from "./collections.js"
import generateMaviggle from "./squiggle.js"
import Canvas  from '@napi-rs/canvas';


const prefix = "?";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const CHANNEL_ID = "879768839582261300";

let collectionNames, collectionTokenId, collectionId, collectionContractAddress, pieceId, artistName, randomCollection, randomPiece, collectionIcon, collectionWebsiteSlug, collectionMintedTokens;

// Send message periodically
client.on("ready", () => {
  console.log("Bot is online!");
  client.user.setActivity("(🎨, 👨‍💻)");

  // Sending random artwork every X msec
  setInterval(() => {
    collectionId = generateRandomCollection();
    pieceId = generateRandomPiece();
    collectionTokenId = generateTokenId(collectionId, pieceId);

    fetchAPI(collectionTokenId);
  }, 2000 * 60 * 60);
});

// Send message as a response
client.on("messageCreate", async (message) => {
  //If the message dosen't start with a prefix or is sent by the bot, do nothing
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  if (message.content === "?maviggle") {

    let canvas = Canvas.createCanvas(800, 800)
    let context = canvas.getContext('2d');

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let squiggleStart = 20;
    let squiggleEnd = canvas.width - 20;
    let step = canvas.width / 13;

    // Document styles
    context.lineWidth = 40;
    context.lineCap = 'round';

    // Gradient setup
    let gradient = context.createLinearGradient(0, centerY, canvas.width, canvas.height);
    let gradients = {
      grad1: ['#c501e1', '#9a26f8', '#6564fe', '#2b97fa', '#02c4e7', '#16e6cc', '#2ef9a0','#67ff6c','#c7e602','#e7c501','#ff6a63','#f82d98','#e830ce'],
      grad2: ['#ffff66', '#fc6e22', '#ff1493', '#c24cf6'],
      grad3: ['#08f7fe', '#09fbd3', '#fe53bb', '#f5d300'],
      grad4: ['#75d5fd', '#b76cfd', '#ff2281', '#011ffd'],
    }

    let palette = Object.values(gradients)[Math.floor(Math.random() * Object.values(gradients).length)];

    for(let i = 0; i < palette.length; i++) {
      gradient.addColorStop(i / palette.length, palette[i]);
    }

    context.strokeStyle = gradient;

    // 🅿ushing 🅿oints v2
    let squigglePoints = [];
    let random;
    let point;

    function pushPoint (point) {
      squigglePoints.push(point);
    }

    point = {x: squiggleStart, y: centerY};
    pushPoint(point);

    for(let i = step; i < canvas.width - step - 1; i+=step) {
      random = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 150;
      point = {x: i, y: centerY + random};
      pushPoint(point);
    }

    point = {x: squiggleEnd, y: centerY};
    pushPoint(point);

    // Drawing & smoothing
    context.moveTo(squigglePoints[0].x, squigglePoints[0].y);

    for(let i = 1; i < squigglePoints.length - 2; i++) {
      let xc = (squigglePoints[i].x + squigglePoints[i + 1].x) / 2;
        let yc = (squigglePoints[i].y + squigglePoints[i + 1].y) / 2;
      context.quadraticCurveTo(squigglePoints[i].x, squigglePoints[i].y, xc, yc);
    }

    // context.quadraticCurveTo(squigglePoints[i].x, squigglePoints[i].y, squigglePoints[i+1].x, squigglePoints[i+1].y);

    context.stroke();

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'maviggle.png' }); 

    message.channel.send({ files: [attachment] }) 

    return;
  }

  // if(message.content === "?art") {
  //   collectionId = generateRandomCollection();
  //   pieceId = generateRandomPiece();
  //   collectionTokenId = generateTokenId(collectionId, pieceId);

  //   fetchAPI(collectionTokenId);
  // }

  const args = message.content.slice(prefix.length).split(/ +/); // Splits the message into two parts

  collectionNames = args.shift().toLowerCase(); // Returns collection name in lower case

  collectionId = fetchCollectionData(collectionNames); // Finds and fetches the collection

  if (isNaN(parseInt(args[args.length - 1]))) {
    pieceId = generateRandomPiece();
  } else {
    pieceId = zeroPad(parseInt(args.pop()), 5); // Returns piece ID, checks if it has enough zeroes or adds if needed
  }

  // Combines collection and a token ID
  collectionTokenId = generateTokenId(collectionId, pieceId);

  fetchAPI(collectionTokenId, message); // Fetch GEN.ART API and pass the channel
});

// Function to add leading zeroes
const zeroPad = (num, places) => String(num).padStart(places, "0");

// Finding and fetching the right collection
function fetchCollectionData(collectionNames) {
  let fetchedCollection;

  for (let i = 0; i < collections.length; i++) {
    for (let j = 0; j < collections[i].collectionNames.length; j++) {
      if (collectionNames == Object.values(collections[i].collectionNames[j])) {
        fetchedCollection = collections[i];
        break;
      }
    }
  }

  if (fetchedCollection != undefined) {
    collectionId = fetchedCollection.collectionId;
    artistName = fetchedCollection.collectionArtist;
    collectionContractAddress = fetchedCollection.collectionContractAddress;
    collectionIcon = fetchedCollection.collectionIcon;
    collectionWebsiteSlug = fetchedCollection.collectionWebsiteSlug;
    collectionMintedTokens = fetchedCollection.collectionMintedTokens;

    return collectionId; // Returning collection id and piece id
  } else {
    collectionId = 0;
    return collectionId; // Returning collection id and piece id
  }
}

// Generating random token ID (collection and a piece)
function generateRandomCollection() {
  randomCollection = Math.floor(Math.random() * collections.length);

  collectionId = collections[randomCollection].collectionId;
  artistName = collections[randomCollection].collectionArtist;
  collectionContractAddress = collections[randomCollection].collectionContractAddress;
  collectionIcon = collections[randomCollection].collectionIcon;
  collectionWebsiteSlug = collections[randomCollection].collectionWebsiteSlug;
  collectionMintedTokens = collections[randomCollection].collectionMintedTokens;

  return collectionId;
}

// Generate random piece from the collection
function generateRandomPiece() {
  randomPiece = zeroPad(Math.floor(Math.random() * collectionMintedTokens), 5);
  return randomPiece;
}

function generateTokenId(collectionId, randomPieceId) {
  return collectionId + randomPieceId;
}

// Generating and sending embed
async function fetchAPI(collectionTokenId, message) {
  // Fetching GEN.ART API
  const collectionData = await fetch(`https://api.gen.art/public/attributes/${collectionTokenId}`).then((res) => res.json());

  if (collectionData.statusCode == 404) {
    if (message == undefined) {
      console.log("No such token or collection " + collectionTokenId) // Get a pre-defined channel ID

      collectionId = generateRandomCollection();
      pieceId = generateRandomPiece();
      collectionTokenId = generateTokenId(collectionId, pieceId);

      fetchAPI(collectionTokenId);
      return;
    } else {
      message.channel.send("No such token or collection");
      return;
    }
  }


  const artEmbed = new EmbedBuilder()
    .setColor("Random")
    .setTitle(`${collectionData.name}`)
    .setURL(`https://api.gen.art/public/live/${collectionTokenId}`)
    .setAuthor({ name: `${artistName}`, url: `https://gen.art/user/${collectionData.artist}?tab=drops` })
    .setDescription(`${collectionData.description.slice(0, 200) + "..."}`)
    .addFields(
      { name: "Website", value: `[View collection](https://gen.art/drops/${collectionWebsiteSlug})`, inline: true },
      { name: "Gallery", value: `[Link](${collectionData.external_url})`, inline: true },
      { name: "Live render", value: `[Link](https://api.gen.art/public/live/${collectionTokenId})`, inline: true },
      { name: "OpenSea", value: `[Link](https://opensea.io/assets/ethereum/${collectionContractAddress}/${collectionTokenId})`, inline: true },
      { name: "LooksRare", value: `[Link](https://looksrare.org/collections/${collectionContractAddress}/${collectionTokenId})`, inline: true },
      { name: "\u200B", value: "\u200B", inline: true }
    )
    .setImage(`${collectionData.image}`)
    .setFooter({ text: `Released on GEN.ART`, iconURL: `${collectionIcon}` });

  if (message == undefined) {
    // If not passing a specific channel
    let messageChannel = client.channels.cache.get(CHANNEL_ID); // Get a pre-defined channel ID
    messageChannel.send({ embeds: [artEmbed] }); // Send embed there
  } else {
    message.channel.send({ embeds: [artEmbed] }); // Send embed as a reply in the channel where the message was inquired
  }
}

client.login("MTAyOTM5NjU5MDY2ODAzMDAyMw.G9lcly.gMekncmPs0K9seJXMglyfTt00w98RQfpr6AsSg");
