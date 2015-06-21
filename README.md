# Rebound Chat

An online open-source chat server

## Usage

    $ git clone git@github.com:ReboundIo/rebound.io.git
    $ cd rebound.io
    $ npm install
    $ node server.js

The first time you start the server, you will be prompted to enter an admin key. This is highly recommended as it will let you access the administrative commands such as kicking and sending announcements.

## Configuration

After starting the server for the first time, the configuration can be accessed from `config.json` in the server's root directory. Restart the server to have configuration changes take effect.

### `port` (default: `3000`)

The HTTP port on which the server will listen.

### `keys` (default: `[]`)

An array of strings representing the admin keys. Users will be able to access administrative features using one of the keys specified in this list.

### `messageLimitWindow` (default: `5`)

The amount of time, in seconds, before the anti-spam cooldown resets.

### `messageLimit` (default `5`)

The amount of messages a user will be able to send until the anti-spam cooldown resets. In other words, after the user sends `messageLimit` messages, they won't be able to send any more until `messageLimitWindow` seconds later.

## Features

- Multi-user chat room
- Anti-spam filter
- Custom name coloring
- Unread message notification
- Kick and ban users
- Chat logging
