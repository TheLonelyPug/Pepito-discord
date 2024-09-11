# Discord bot for Pépito API

An unofficial Discord bot for the [Pépito-API](https://github.com/Clement87/Pepito-API?). Written in javascript with Discord.js

Currently used for the [Discord bot](https://discord.com/oauth2/authorize?client_id=1282732564657737788&permissions=2147601408&integration_type=0&scope=bot).

## Build

You can use the Dockerfile to generate a docker image. 
There is an example [docker-compose](https://github.com/marcschuler/pepito-mastodon/blob/master/docker-compose.yml) file.

## Configuration

You need to install the following packages with npm:
```
npm install dotenv
npm install discord.js
npm install eventsource
```

| Key                   | .env              | Example value                                                                 |
|-----------------------|-------------------|-------------------------------------------------------------------------------|
| Pêpito API Url        | CAT_DOOR_API_URL  | https://api.thecatdoor.com/sse/v1/events                                      |
| Pêpito icon Url       | PEPITO_ICON_URL   | https://pbs.twimg.com/profile_images/1713252555336134657/gD97QysY_400x400.jpg |
| Bot token             | DISCORD_BOT_TOKEN | 937it3ow87i4ery69876wqire                                                     |
| Bot client ID         | CLIENT_ID         | 332269999912132097                                                            |

Neither the token and client ID provided here is real and is taken from the [Discord.js OAuth2](https://discord.com/developers/docs/topics/oauth2) page, you will have to provide your own. 
Both API Url and icon Url will be present in the .env file.

## License

This work is licensed under GNU GPLv3
