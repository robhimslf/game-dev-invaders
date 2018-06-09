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

// HOOK, PART 1: The preload hook.
function handlePreload() {

    // Preload our "sky".
    this.load.image( 'starfield', 'starfield.png' );

    // Preload our player.
    this.load.image( 'ship', 'player.png' );

    // Preload the enemy image.
    this.load.spritesheet( 'invader', 'invader50x60x10.png', {
        frameWidth: 50,
        frameHeight: 60
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

    // Set starfield's value to be a tile sprite, and make sure it's scaled properly.
    starfield = this.add.tileSprite( 0, 0, 2048, 2048, 'starfield' );
    starfield.setScale( 1 );

    // Add the player as a sprite to the game physics!
    player = this.physics.add.sprite( 400, 500, 'ship' );
    player.setOrigin( 0.5, 0 );
    player.setCollideWorldBounds( true );

    // Create a group to hold our invaders.
    aliens = this.physics.add.group();
    createAliens();

    // We only want the cursor keys (arrows).
    cursors = this.input.keyboard.createCursorKeys();
}

// HOOK, PART 3: The update hook.
function handleUpdate() {
    
    // Scroll our starfield background.
    starfield.tilePositionY += 2;

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