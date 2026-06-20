/**
 * @author System
 * @title Balance Canvas v2
 * @name balance
 * @class balance
 * @version 2.0.0
 * @description Affiche votre solde sous forme de carte bancaire stylisée via Canvas (sans Currencies).
 * @usage balance
 */

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "2.0.0",
    author: "System",
    countDown: 2,
    role: 0,
    description: "Balance style carte bancaire avec usersData",
    category: "Economy",
    guide: {
      en: "{p}balance - Afficher votre carte bancaire"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;

    // Récupération et initialisation sécurisée des données de l'utilisateur
    async function getUserProfile(id) {
      let userData = await usersData.get(id);
      if (!userData) userData = {};
      if (!userData.data) userData.data = {};
      
      // Initialisation par défaut si inexistant
      if (userData.money === undefined) userData.money = 500; 
      if (userData.data.bank === undefined) userData.data.bank = { balance: 0 };
      
      return userData;
    }
