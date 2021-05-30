// FIRST: Phaser configuration.
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: handlePreload,
        create: handleCreate,
        update: handleUpdate
    }
};

// SECOND: Jump-start Phaser with our configuration.
var game = new Phaser.Game( config );

// This is our background image.
var background;

// This is our player.
var player;

// These are the keyboard buttons we're keeping track of.
var cursors;

// This is our collection of alien invaders.
var aliens;

// This is our collection of player bullets.
var bullets;

// This is our collection of alien bullets.
var enemyBullets;

// This is the last time an alien invader fired a bullet.
var lastAlienBulletTime = 0;

// This is a collection of living alien invaders.
var livingAliens = [];

// This is the last time the player fired a bullet.
var lastPlayerBulletTime = 0;

// This is a collection of explosions.
var explosions;

// The player's current score.
var score = 0;

// The prefix text for the score.
var scorePrefix = 'SCORE: ';

// The combined scorePrefix and score.
var scoreText;

// The "health" of the player.
var playerLives;

// This is going to tell us whether the game should end.
var isGameOver = false;

// The "Game Over" screen.
var gameOverModal;

// The "Game Over" text.
var gameOverText;

// This is a single bullet instance.
var Bullet = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Bullet( scene, x, y, defaultKey ) {
        // Tell Phaser to use our preloaded image.
        Phaser.GameObjects.Image.call( this, scene, 0, 0, defaultKey );

        // Is this a bullet for the enemy?
        this.isEnemyBullet = ( defaultKey === 'enemyBullet' );

        // This is our base speed.
        this.speed = 0.1;

        // This is the time when the bullet was "born" (fired).
        this.born = 0;

        // This is the direction the bullet is traveling.
        this.direction = 0;

        // This is the bullet's speed along the x-axis.
        this.xSpeed = 0;

        // This is the bullet's speed along the y-axis.
        this.ySpeed = 0;

        // Set the image size based on the type of bullet.
        if ( this.isEnemyBullet ) {
            this.setSize( 9, 9, true );
        } else {
            this.setSize( 6, 36, true );
        }
    },

    fire: function( shooter, target ) {

        // Set the starting x- and y-coordinates to the shooter's.
        this.setPosition( shooter.x, shooter.y );

        // Set things assuming that the player is shooting.
        this.direction = 90;
        this.xSpeed = 0;
        this.ySpeed = -this.speed;
        this.born = 0;

        // But if an alien is shooting, reset those.
        if ( this.isEnemyBullet ) {

            // Calculate the direction.
            var xDifference = target.x - this.x;
            var yDifference = target.y - this.y;
            this.direction = Math.atan( xDifference / yDifference );

            // Calculate the x-axis speed against the direction.
            this.xSpeed = this.speed * Math.sin( this.direction );

            // Calculate the y-axis speed against the direction.
            this.ySpeed = this.speed * Math.cos( this.direction );

            // Calculate a rotation for an enemy bullet.
            this.rotation = Phaser.Math.Angle.Between(
                shooter.x,
                shooter.y,
                target.x,
                target.y
            );
        }
    },

    update: function( time, delta ) {

        // Set this bullet's x-coordinate.
        this.x += this.xSpeed * delta;

        // Set this bullet's y-coordinate.
        this.y += this.ySpeed * delta;

        // Update this bullet's born time.
        this.born += delta;

        // If it's more than 5,000 milliseconds, it's off the screen.
        // Remove it from the game, so Phaser doesn't have to track it anymore.
        if ( this.born > 5000 ) {
            this.setActive( false );
            this.setVisible( false );
        }
    }
});

// HOOK, PART 1: The preload hook.
function handlePreload() {

    // Preload our "sky".
    this.load.image( 'starfield', 'assets/starfield.png' );

    // Preload our player.
    this.load.image( 'ship', 'assets/player.png' );

    // Preload the enemy image.
    this.load.spritesheet( 'invader', 'assets/invader50x60x10.png', {
        frameWidth: 50,
        frameHeight: 60
    });

    // Preload the player bullet image.
    this.load.image( 'bullet', 'assets/bullet.png' );

    // Preload the enemy bullet.
    this.load.image( 'enemyBullet', 'assets/enemy-bullet.png' );

    // Preload the explosion image.
    this.load.spritesheet( 'kaboom', 'assets/explode.png', {
        frameWidth: 128,
        frameHeight: 128
    });
}

// HOOK, PART 2: The create hook.
function handleCreate() {

    // Setup our aliens' "hover" animation.
    this.anims.create({
        key: 'hover',
        frames: this.anims.generateFrameNumbers( 'invader', {
            start: 0,
            end: 9
        }),
        frameRate: 10,
        repeat: -1
    });

    // Setup our explosion animation.
    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers( 'kaboom', {
            start: 0,
            end: 15
        }),
        frameRate: 16,
        repeat: 0,
        hideOnComplete: true
    });

    // Set starfield's value to be a tile sprite, and make sure it's scaled properly.
    starfield = this.add.tileSprite( 0, 0, 2048, 2048, 'starfield' );
    starfield.setScale( 1 );

    // Setup the score text.
    scoreText = this.add.text( 10, 15, scorePrefix + score );

    // Setup the player's lives.
    playerLives = this.add.group();
    this.add.text(
        this.sys.canvas.width - 185,    // From the right.
        15,                             // From the top.
        'LIVES:'
    );
    createPlayerLives( this );

    // Add the player as a sprite to the game physics!
    player = this.physics.add.sprite( 400, 500, 'ship' );
    player.setOrigin( 0.5, 0 );
    player.setCollideWorldBounds( true );

    // Create a group to hold our invaders.
    aliens = this.physics.add.group();
    createAliens();

    // Create the player and alien bullet collections.
    bullets = createBullets( 'bullet', this );
    enemyBullets = createBullets( 'enemyBullet', this );

    // Create some explosions!
    explosions = this.add.group({
        defaultKey: 'kaboom',
        maxSize: 32
    });

    // We only want the cursor keys (arrows).
    cursors = this.input.keyboard.createCursorKeys();

    // Wire up the player's firing mechanism.
    firePlayerBullet( this );

    // Setup the game over screen.
    createGameOverModal( this );
}

// HOOK, PART 3: The update hook.
function handleUpdate( time ) {
    
    // Scroll our starfield background.
    starfield.tilePositionY += isGameOver ? 0.5 : 2;

    // Is the player pressing the left arrow?
    if ( cursors.left.isDown ) {
        player.setVelocityX( -200 );
    }

    // Is the player pressing the right arrow?
    else if ( cursors.right.isDown ) {
        player.setVelocityX( 200 );
    }

    // Otherwise, we need to slow them down.
    else {
        player.setVelocityX( 0 );
    }
    
    // If the invaders haven't fired recently - and the game isn't over - fire one.
    if ( time > lastAlienBulletTime && !isGameOver ) {
        fireEnemyBullet( player, time, this );
    }
}

// This will create our collection of aliens.
function createAliens() {

    // We want 3 rows of 10 aliens each.
    for ( var y = 0; y < 3; y++ ) {
        for ( var x = 0; x < 10; x++ ) {
            var alien = aliens.create( x * 75, y * 90, 'invader' );
            alien.setOrigin( 0.5, 0.5 );
            alien.lastFired = 0;
            alien.play( 'hover' );
        }
    }

    // Center our collection of aliens.
    Phaser.Actions.IncX( aliens.getChildren(), 60 );

    // Bring them further into the scene vertically.
    Phaser.Actions.IncY( aliens.getChildren(), 75 );
}

// This will create a collection of bullets.
function createBullets( imageName, sceneRef ) {
    return sceneRef.physics.add.group({
        classType: Bullet,
        defaultKey: imageName,
        runChildUpdate: true
    });
}

// This will periodically fire a bullet from a random alien invader.
function fireEnemyBullet( player, time, sceneRef ) {

    // Grab the first bullet in the group, activate it, and make it visible.
    var enemyBullet = enemyBullets.get().setActive( true ).setVisible( true );

    // Find out how many alien invaders are still "alive," and track them.
    livingAliens = aliens.getChildren().filter( alien => alien.active === true );

    // If we have an instance of enemyBullet, AND there are aliens still alive.
    if ( enemyBullet && livingAliens.length > 0 ) {

        // Get a random number between 0 and the number of aliens alive.
        var randomAlienNumber = Phaser.Math.RND.integerInRange(
            0,
            livingAliens.length - 1
        );

        // Get the alien from the collection with that number.
        var randomAlien = livingAliens[ randomAlienNumber ];

        // If this alien hasn't fired in the last 4,000 milliseconds...
        if ( time - randomAlien.lastFired > 4000 ) {

            // Set the lastFired, so the alien doesn't fire again for a while.
            randomAlien.lastFired = time;

            // FIRE ZE BULLET!
            enemyBullet.fire( randomAlien, player );

            // Setup collision handling.
            sceneRef.physics.add.collider( player, enemyBullet, handlePlayerCollision );

            // Update the global last fired time, and add 2,000 milliseconds.
            lastAlienBulletTime = time + 2000;
        }
    }
}

// This will handle the user firing a bullet.
function firePlayerBullet( sceneRef ) {

    sceneRef.input.keyboard.on( 'keydown_SPACE', () => {

        // If the player died, no processing!
        if ( player.active === false ) {
            return;
        }

        // Grab the first bullet in the group, activate it, and make it visible.
        var playerBullet = bullets.get().setActive( true ).setVisible( true );

        // As long as we have a valid bullet, fire it.
        if ( playerBullet && sceneRef.time.now - lastPlayerBulletTime > 1000 ) {

            // We don't need a target, since we don't need to calculate angles.
            playerBullet.fire( player );

            // Setup collision handling.
            sceneRef.physics.add.collider( aliens, playerBullet, handleEnemyCollision );

            // Update the player last fired time.
            lastPlayerBulletTime = sceneRef.time.now;
        }
    }, sceneRef );
}

// This will handle a bullet colliding with a player or alien.
function handleCollision( target, bullet ) {

    // If both the target and bullet are active.
    if ( target.active === true && bullet.active === true ) {
        
        // Deactivate the bullet, and take it off the screen.
        bullet.setActive( false ).setVisible( false );

        // Get the first explosion, and activate it.
        var explosion = explosions.get();
        if ( explosion ) {
            explosion.setActive( true );
            explosion.setOrigin( 0.5, 0.5 );
            explosion.x = target.x;
            explosion.y = target.y;
            explosion.play( 'explode' );
        }
    }
}

// This will handle a bullet colliding with the player.
function handlePlayerCollision( player, bullet ) {

    // If both the player and bullet are active...
    if ( player.active === true && bullet.active === true ) {

        // Fire the generic collision handler.
        handleCollision( player, bullet );

        // Remove a life.
        var life = playerLives.getFirstAlive();
        if ( life ) {
            life.setActive( false ).setVisible( false );
        }

        // Game Over condition: has the player lost all their lives?
        if ( playerLives.countActive() < 1 ) {
            handleGameOver( false );
        }
    }
}

// This will handle a bullet colliding with an alien.
function handleEnemyCollision( bullet, alien ) {
    if ( bullet.active === true && alien.active === true ) {

        // Fire the generic collision handler.
        handleCollision( alien, bullet );

        // Deactivate and remove the alien from the screen.
        alien.setActive( false ).setVisible( false );

        // Increment the score.
        score += 20;
        scoreText.setText( scorePrefix + score );

        // Game Over condition: has the player killed all the alien invaders?
        if ( aliens.countActive() === 0 ) {

            // Award a bonus for winning.
            score += 1000;
            scoreText.setText( scorePrefix + score );

            // Handle Game Over.
            handleGameOver( true );
        }
    }
}

// This will create the player's lives (health).
function createPlayerLives( sceneRef ) {

    // Our x-coordinate for the lives images.
    var x = sceneRef.sys.canvas.width - 105;

    // Only 3.
    for ( var i = 0; i < 3; i++ ) {
        // Calculate this life's x-coordinate.
        var lifeX = x + 40 * i;

        // Add a life to our collection of lives.
        var life = playerLives.create( lifeX, 25, 'ship' );

        // Set the life's origin, scale, and opacity.
        life.setOrigin( 0.5, 0.5 );
        life.setScale( 0.5 );
        life.alpha = 0.4;
    }
}

// This will setup and handle our game over screen.
function createGameOverModal( sceneRef ) {

    // Create a "modal" window.
    gameOverModal = sceneRef.add.graphics();

    // Set its background color.
    gameOverModal.fillStyle( 0x303030, 0.8 );

    // Set its shape, x- and y-coordinates, and size.
    gameOverModal.fillRect(
        0,
        0,
        sceneRef.sys.canvas.width,
        sceneRef.sys.canvas.height
    );

    // It shouldn't be visible... yet.
    gameOverModal.visible = false;

    // Get our game over text ready.
    gameOverText = sceneRef.add.text(
        sceneRef.sys.canvas.width / 2,
        sceneRef.sys.canvas.height / 2,
        ' ',
        {
            align: 'center'
        }
    );
    gameOverText.setOrigin( 0.5, 0.5 );

    // It shouldn't be visible... yet.
    gameOverText.visible = false;

    // Handle the player wanting to start over on mouse click.
    sceneRef.input.on( 'pointerdown', ( pointer ) => {

        // Only on a Game Over condition.
        if ( isGameOver ) {

            // Reset everything.
            bullets.clear( true, true );
            enemyBullets.clear( true, true );
            explosions.clear( true, true );
            aliens.clear( true, true );
            playerLives.clear( true, true );

            // Create again.
            createAliens();
            createPlayerLives( sceneRef );
            player.setActive( true ).setVisible( true );

            // Hide the text, followed by the modal.
            gameOverText.visible = false;
            gameOverModal.visible = false;            

            // Reset the game over state.
            isGameOver = false;
        }
    }, sceneRef );
}

// Shows our game over modal with text based on whether the player won.
function handleGameOver( didPlayerWin ) {

    // Set the condition flag, so the aliens stop firing if any are left.
    isGameOver = true;

    // Remove and disable a group item.
    var removeDisableItem = function( item ) {
        item.setActive( false ).setVisible( false );
    };

    // Disable all bullets, so no one can fire.
    Phaser.Utils.Array.Each( bullets.getChildren(), removeDisableItem );
    Phaser.Utils.Array.Each( enemyBullets.getChildren(), removeDisableItem );
    Phaser.Utils.Array.Each( aliens.getChildren(), removeDisableItem );

    // Disable the player.
    player.setActive( false ).setVisible( false );

    // The text to display, based on whether the player won.
    var displayText = ( didPlayerWin )
        ? ' YOU WON! \n\n Click to restart.'
        : ' GAME OVER \n\n Click to restart.';

    // Set the text.
    gameOverText.setText( displayText );

    // Show the modal, followed by the text.
    gameOverModal.visible = true;
    gameOverText.visible = true;
}