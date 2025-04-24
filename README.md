# FeedEm

FeedEm is a simulator game where you take on the role of a social network algorithm which manages a social network of users.
Implemented in Angular as a browser game.

## Design decisions

### Game modes

- *endless* - the game never ends, the player can play as long as they want - used in Screen Saver Gallery.
- *survival* - the game ends when the player loses all lives.

### Time

There are two types of time used in the codebase:
- *f_created*, *f_timestamp* - fictional time - the in-game time which we show to the player and users
- *r_created*, *r_timestamp* - real time - the real time, which we use for logging and debugging

### Task

In targeting task there could be two phases:
1. Algorithm chooses set of users, those will then generate reactions and comments,
2. Additionaly Algorithm could add more users to the interaction, to balance the comments section and reactions.


### Meeting 31.3.2025:
Few design decisions from meeting on 31.3.2025:

#### HERO 
To keep things simple and narrative/touching/personal, the Player/Algorithm manages a single user - Hero.
Player manages the Hero in two ways:
- *targeting* other users with Hero's posts
- *filtering* which posts Hero will see

In the game narrative it is explained that every AI algorithm has its own Hero (a person that it tries to please and manage).
The algorithms' ability is to recommend posts of their Hero to other instances of AI algorithm.
The Instance of AI algorithm takes the recommendation and decides whether to show the post to Hero or not.

#### Users
Users are LLM simulated persons using the simulated social network.
Identities of users are prewritten.

#### Screen Saver Gallery
For Screen Saver Gallery the game will be modified a little bit.
All visitors will see just a single game.
There will be a QR to start playing the game.
Just one person can play at a time.

## DEVELOPMENT

Frontend is implemented in Angular, in the root of the repository.


## Development - Angular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

### Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

### Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Running tests

```bash
ng test
```

### Unit test 

This will test the /lib folder.

```
npm run vitest
```

### Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
