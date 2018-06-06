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

// HOOK, PART 1: The preload hook.
function handlePreload() {

    // Preload our "sky".
    this.load.image( 'starfield', 'starfield.png' );
}

// HOOK, PART 2: The create hook.
function handleCreate() {

    // Set starfield's value to be a tile sprite, and make sure it's scaled properly.
    starfield = this.add.tileSprite( 0, 0, 2048, 2048, 'starfield' );
    starfield.setScale( 1 );
}

// HOOK, PART 3: The update hook.
function handleUpdate() {
    
    // Scroll our starfield background.
    starfield.tilePositionY += 2;
}