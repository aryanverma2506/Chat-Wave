# [Chat-Wave-MERN-Application](https://chat-wave-mern-client.web.app/)

This repository contains a web application with a frontend built using React.js and a backend built using Node.js. Below are the instructions on how to install, deploy, run, and use the web app.

## Note

> * You may need to configure your own `.env` and `nodemon.json` files, although I have already provided sample configuration files named `.env.sample` and `nodemon.sample.json` inside client and server directories, respectively.
> * I recommend running the following command `npm run dev` in the server directory since it will directly take the environmental variables from the `nodemon.json` file. Otherwise, you will have to provide all the environmental variables in the command line itself.
> * You may also need to configure your own `MONGODB_URI` `inside nodemon.json`.
> * The preview of the web links is working, but you need to wait until it fetches the data from the server, which may take up to 4-5 minutes for the first request. After that, it will take less time.
> * You can find images related to this web application at the bottom of this file.

## Installation

1. Clone the repository to your local machine:

```markdown
git clone https://github.com/aryanverma2506/Chat-Wave-MERN-Application.git
cd Chat-Wave-MERN-Application
```

2. Install frontend dependencies:

```markdown
cd client
npm install
```

3. Install backend dependencies:

```markdown
cd server
npm install
```

## Deployment

### Frontend

To deploy the frontend, you have two options:

1. Development Build: Run the frontend in development mode with hot-reloading.

```markdown
cd client
npm start
```

By default, the frontend will run on [http://localhost:3000](http://localhost:3000).

2. Production Build: Build the frontend for production.

```markdown
cd client
npm run build
```

After running the production build, you will have a build directory containing the optimized files.

### Backend

To deploy the backend, you will need to compile the TypeScript code into JavaScript and then run the server.

1. Development Mode - Start the server:

```markdown
cd server
npm run dev
```

2. Production Mode - Start the server:

```markdown
cd server
npm start
```

By default, the backend will run on [http://localhost:8080](http://localhost:8080).

# Usage

With both the frontend and backend deployed, you can now access the web app through your browser.

1. Open your web browser and go to [http://localhost:3000](http://localhost:3000) (or the specified port if you modified it).

2. The web app will be loaded, and now you have to register yourself by providing a username and password.

3. After registering, you can chat with anyone who has already registered on the app.

# Folder Structure

```markdown
Chat-Wave-MERN-Application/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── models/
│   │   ├── screens/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── package.json
│   └── ...
├── screenshots/
├── serer/
│   ├── dist/
│   │   ├── bin/
│   │   │   └── www.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── util/
│   │   └── app.js
│   │   └── socket.js
│   ├── src/
│   │   ├── bin/
│   │   │   └── www.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── util/
│   │   └── app.ts
│   │   └── socket.ts
│   ├── uploads/
│   ├── tsconfig.json
│   ├── package.json
│   └── ...
├── .gitignore
├── README.md
└── ...
```

# Sneak Peek

![](screenshots/Screenshot-1.png)


![](screenshots/Screenshot-2.png)


![](screenshots/Screenshot-3.png)


![](screenshots/Screenshot-4.png)