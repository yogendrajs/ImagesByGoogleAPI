const fs = require('fs');
const express = require('express');
const readline = require('readline');
const {google} = require('googleapis');

const app = express();
app.set('view engine', 'ejs');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

app.get('/', (req, rep) => {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), listFiles);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error retrieving access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }

    /**
     * Lists the names and IDs of up to 10 files.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */

    function listFiles(auth) {
      const drive = google.drive({version: 'v3', auth});

        drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)'}, (err, res) => {

        if (err) { 
          return console.log('The API returned an error: ' + err);
        }
        const files = res.data.files;
        if (files.length) {

          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            // console.log(`${file.name}: ${file.id}`);
            if (file.name == 'Images'){
              folderLink = `https://drive.google.com/embeddedfolderview?id=${file.id}#grid`;
              // console.log(folderLink);
              
              drive.files.list({
                q: `'${file.id}' in parents`
              }, (err, data) => {
                if (!err){
                  var allImages = data.data.files;
                  
                  var perlink = [];
                  for (var j in allImages){
                    perlink.push(`https://drive.google.com/uc?export=view&id=${allImages[j].id}`);
                  }
                  rep.render('index',{link: perlink, title:"My Images", count: j});
                }
              })
            }
          }

        } else {
          console.log('No files found.');
        }
      });
    }
})

var server = app.listen(3030, () => {
  console.log(`port is listening at ${server.address().port}`)
})
