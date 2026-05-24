(function(root) {
  function createImageAssets() {
    return {
      backButton: null,
      backgrounds: [],
      calibrateButton: null,
      configMenuButton: null,
      durationButtons: [],
      fightButton: null,
      fightMenuButton: null,
      framerateButtons: [],
      goodHit: null,
      keepTrying: null,
      leftFoot: null,
      levelButtons: [],
      logo: null,
      me: null,
      meAnimations: [],
      menu: null,
      opponentAnimations: [],
      opponents: [],
      padButton: null,
      resetButton: null,
      rightFoot: null,
      seriesButtons: [],
      shadowButton: null,
      stopButton: null,
      yourGuard: null
    };
  }

  function createSoundAssets() {
    return {
      awesome: null,
      click: null,
      continue: null,
      good: null,
      great: null,
      keepTrying: null,
      letsFight: null,
      perfect: null,
      punch: null,
      thatsIt: null,
      wellDone: null,
      yourGuard: null
    };
  }

  async function loadGameAssets({
    gameLength,
    gameLevel,
    loadImage,
    loadSound,
    menuTypes
  }) {
    const backgroundImages = [];
    for (const m of Object.keys(menuTypes)) {
      backgroundImages[m] = await loadImage('assets/backgrounds/' + m + '.jpg');
    }

    const framerateButtonImage = [];
    for (let i = 0; i < 7; i++ ) {
      framerateButtonImage[i] = await loadImage('assets/images/fr' + (i * 20) + '.png');
    }

    const levelButtonImage = [];
    for (let i = 0; i < Object.keys(gameLevel).length; i++ ) {
      levelButtonImage[i] = await loadImage('assets/images/' + gameLevel[i.toString()] + '.png');
    }

    const durationButtonImage = [];
    for (let i = 1; i <= Object.keys(gameLength).length; i++ ) {
      durationButtonImage[i] = await loadImage('assets/images/' + gameLength[i.toString()] + '.png');
    }

    const seriesButtonImage = [];
    for (let i = 1; i <= 5; i++ ) {
      seriesButtonImage[i] = await loadImage('assets/images/s' + i + '.png');
    }

    const meImages = [];
    meImages[0] = [];
    meImages[1] = [];
    for (let j = 1; j < 7; j++) {
      meImages[j] = [];
      for (let i = 0; i < 7; i++) {
        meImages[j][i] = await loadImage('assets/images/boxers/' + j + '-me-' + i + '.png');
      }
    }

    const opponentImage = [];
    const opponentsImages = [];
    opponentImage[0] = await loadImage('assets/images/opponents/0/0-1.png');
    opponentsImages[0] = [];
    opponentsImages[1] = [];
    for (let j = 1; j <= 6; j++) {
      opponentsImages[j] = [];
      for (let i = 0; i < 7; i++) {
        opponentsImages[j][i] = await loadImage('assets/images/opponents/0/' + j + '-' + i + '.png');
      }
    }

    return {
      images: {
        backButton: await loadImage('assets/images/back.png'),
        backgrounds: backgroundImages,
        calibrateButton: await loadImage('assets/images/calibrate.png'),
        configMenuButton: await loadImage('assets/images/config.png'),
        durationButtons: durationButtonImage,
        fightButton: await loadImage('assets/images/fight.png'),
        fightMenuButton: await loadImage('assets/images/fightmenu.png'),
        framerateButtons: framerateButtonImage,
        goodHit: await loadImage('assets/images/good_hit.png'),
        keepTrying: await loadImage('assets/images/keep_trying.png'),
        leftFoot: await loadImage('assets/images/LFoot.png'),
        levelButtons: levelButtonImage,
        logo: await loadImage('assets/logos/logo.512.rounded.png'),
        me: await loadImage('assets/images/boxers/0-me.png'),
        meAnimations: meImages,
        menu: await loadImage('assets/images/menu_image.png'),
        opponentAnimations: opponentsImages,
        opponents: opponentImage,
        padButton: await loadImage('assets/images/pad.png'),
        resetButton: await loadImage('assets/images/reset.png'),
        rightFoot: await loadImage('assets/images/RFoot.png'),
        seriesButtons: seriesButtonImage,
        shadowButton: await loadImage('assets/images/shadow.png'),
        stopButton: await loadImage('assets/images/stop.png'),
        yourGuard: await loadImage('assets/images/your_guard.png')
      },
      sounds: {
        awesome: await loadSound('assets/sounds/awesome.mp3'),
        click: await loadSound('assets/sounds/click.mp3'),
        continue: await loadSound('assets/sounds/continue.mp3'),
        good: await loadSound('assets/sounds/good.mp3'),
        great: await loadSound('assets/sounds/great.mp3'),
        keepTrying: await loadSound('assets/sounds/keep_trying.mp3'),
        letsFight: await loadSound('assets/sounds/letsfight.mp3'),
        perfect: await loadSound('assets/sounds/perfect.mp3'),
        punch: await loadSound('assets/sounds/punch.mp3'),
        thatsIt: await loadSound('assets/sounds/thats_it.mp3'),
        wellDone: await loadSound('assets/sounds/well_done.mp3'),
        yourGuard: await loadSound('assets/sounds/your_guard.mp3')
      }
    };
  }

  async function loadAssetsIntoState(options) {
    const assets = await loadGameAssets(options);
    Object.assign(root.images, assets.images);
    Object.assign(root.sounds, assets.sounds);
    return assets;
  }

  root.images = root.images || createImageAssets();
  root.sounds = root.sounds || createSoundAssets();

  const api = {
    createImageAssets,
    createSoundAssets,
    loadAssetsIntoState,
    loadGameAssets
  };

  root.TfitAssets = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
