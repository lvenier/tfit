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
      doorClose: null,
      good: null,
      great: null,
      doorOpen: null,
      keepTrying: null,
      letsFight: null,
      perfect: null,
      punch: null,
      thatsIt: null,
      wellDone: null,
      yourGuard: null
    };
  }

  async function loadNumberedAssets({ count, loadAsset, pathFor, start = 0 }) {
    const entries = await Promise.all(
      Array.from({ length: count }, (_, index) => {
        const assetIndex = start + index;
        return loadAsset(pathFor(assetIndex)).then(asset => [assetIndex, asset]);
      })
    );

    return entries.reduce((assets, [index, asset]) => {
      assets[index] = asset;
      return assets;
    }, []);
  }

  async function loadAnimationGrid({ columns, loadAsset, pathFor, rows, startRow = 1 }) {
    const entries = await Promise.all(
      Array.from({ length: rows }, (_, rowOffset) => {
        const row = startRow + rowOffset;
        return Promise.all(
          Array.from({ length: columns }, (_, column) => (
            loadAsset(pathFor(row, column)).then(asset => [column, asset])
          ))
        ).then(rowEntries => [row, rowEntries]);
      })
    );

    return entries.reduce((animations, [row, rowEntries]) => {
      animations[row] = rowEntries.reduce((frames, [column, asset]) => {
        frames[column] = asset;
        return frames;
      }, []);
      return animations;
    }, [[], []]);
  }

  async function loadAssetMap(paths, loadAsset) {
    const entries = await Promise.all(
      Object.entries(paths).map(([key, path]) => (
        loadAsset(path).then(asset => [key, asset])
      ))
    );

    return Object.fromEntries(entries);
  }

  function createConcurrentLoader(loadAsset, limit) {
    let active = 0;
    const queue = [];

    function runNext() {
      if (active >= limit || queue.length === 0) {
        return;
      }

      active += 1;
      const { path, reject, resolve } = queue.shift();
      Promise.resolve()
        .then(() => loadAsset(path))
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          runNext();
        });
    }

    return path => new Promise((resolve, reject) => {
      queue.push({ path, reject, resolve });
      runNext();
    });
  }

  function createTrackedLoader(loadAsset, progress) {
    return async path => {
      const asset = await loadAsset(path);
      progress.loaded += 1;
      progress.onProgress({
        label: progress.label,
        loaded: progress.loaded,
        total: progress.total
      });
      return asset;
    };
  }

  function countGameAssets({ gameLength, gameLevel, menuTypes }) {
    return Object.keys(menuTypes).length +
      7 +
      Object.keys(gameLevel).length +
      Object.keys(gameLength).length +
      5 +
      42 +
      1 +
      42 +
      17 +
      14;
  }

  async function loadGameAssets({
    gameLength,
    gameLevel,
    loadImage,
    loadSound,
    menuTypes,
    onProgress = () => {}
  }) {
    const progress = {
      label: "Loading assets",
      loaded: 0,
      onProgress,
      total: countGameAssets({ gameLength, gameLevel, menuTypes })
    };
    progress.onProgress({
      label: progress.label,
      loaded: progress.loaded,
      total: progress.total
    });

    const loadImageLimited = createTrackedLoader(createConcurrentLoader(loadImage, 8), progress);
    const loadSoundLimited = createTrackedLoader(createConcurrentLoader(loadSound, 4), progress);
    const [
      backgroundImages,
      framerateButtonImage,
      levelButtonImage,
      durationButtonImage,
      seriesButtonImage,
      meImages,
      opponentZero,
      opponentsImages,
      fixedImages,
      soundAssets
    ] = await Promise.all([
      loadNumberedAssets({
        count: Object.keys(menuTypes).length,
        loadAsset: loadImageLimited,
        pathFor: index => 'assets/backgrounds/' + index + '.jpg'
      }),
      loadNumberedAssets({
        count: 7,
        loadAsset: loadImageLimited,
        pathFor: index => 'assets/images/fr' + (index * 20) + '.png'
      }),
      loadNumberedAssets({
        count: Object.keys(gameLevel).length,
        loadAsset: loadImageLimited,
        pathFor: index => 'assets/images/' + gameLevel[index.toString()] + '.png'
      }),
      loadNumberedAssets({
        count: Object.keys(gameLength).length,
        loadAsset: loadImageLimited,
        pathFor: index => 'assets/images/' + gameLength[index.toString()] + '.png',
        start: 1
      }),
      loadNumberedAssets({
        count: 5,
        loadAsset: loadImageLimited,
        pathFor: index => 'assets/images/s' + index + '.png',
        start: 1
      }),
      loadAnimationGrid({
        columns: 7,
        loadAsset: loadImageLimited,
        pathFor: (row, column) => 'assets/images/boxers/' + row + '-me-' + column + '.png',
        rows: 6
      }),
      loadImageLimited('assets/images/opponents/0/0-1.png'),
      loadAnimationGrid({
        columns: 7,
        loadAsset: loadImageLimited,
        pathFor: (row, column) => 'assets/images/opponents/0/' + row + '-' + column + '.png',
        rows: 6
      }),
      loadAssetMap({
        backButton: 'assets/images/back.png',
        calibrateButton: 'assets/images/calibrate.png',
        configMenuButton: 'assets/images/config.png',
        fightButton: 'assets/images/fight.png',
        fightMenuButton: 'assets/images/fightmenu.png',
        goodHit: 'assets/images/good_hit.png',
        keepTrying: 'assets/images/keep_trying.png',
        leftFoot: 'assets/images/LFoot.png',
        logo: 'assets/logos/logo.512.rounded.png',
        me: 'assets/images/boxers/0-me.png',
        menu: 'assets/images/menu_image.png',
        padButton: 'assets/images/pad.png',
        resetButton: 'assets/images/reset.png',
        rightFoot: 'assets/images/RFoot.png',
        shadowButton: 'assets/images/shadow.png',
        stopButton: 'assets/images/stop.png',
        yourGuard: 'assets/images/your_guard.png'
      }, loadImageLimited),
      loadAssetMap({
        awesome: 'assets/sounds/awesome.mp3',
        click: 'assets/sounds/click.mp3',
        continue: 'assets/sounds/continue.mp3',
        doorClose: 'assets/sounds/door_close.mp3',
        good: 'assets/sounds/good.mp3',
        great: 'assets/sounds/great.mp3',
        doorOpen: 'assets/sounds/door_open.mp3',
        keepTrying: 'assets/sounds/keep_trying.mp3',
        letsFight: 'assets/sounds/letsfight.mp3',
        perfect: 'assets/sounds/perfect.mp3',
        punch: 'assets/sounds/punch.mp3',
        thatsIt: 'assets/sounds/thats_it.mp3',
        wellDone: 'assets/sounds/well_done.mp3',
        yourGuard: 'assets/sounds/your_guard.mp3'
      }, loadSoundLimited)
    ]);

    const opponentImage = [];
    opponentImage[0] = opponentZero;

    return {
      images: {
        backButton: fixedImages.backButton,
        backgrounds: backgroundImages,
        calibrateButton: fixedImages.calibrateButton,
        configMenuButton: fixedImages.configMenuButton,
        durationButtons: durationButtonImage,
        fightButton: fixedImages.fightButton,
        fightMenuButton: fixedImages.fightMenuButton,
        framerateButtons: framerateButtonImage,
        goodHit: fixedImages.goodHit,
        keepTrying: fixedImages.keepTrying,
        leftFoot: fixedImages.leftFoot,
        levelButtons: levelButtonImage,
        logo: fixedImages.logo,
        me: fixedImages.me,
        meAnimations: meImages,
        menu: fixedImages.menu,
        opponentAnimations: opponentsImages,
        opponents: opponentImage,
        padButton: fixedImages.padButton,
        resetButton: fixedImages.resetButton,
        rightFoot: fixedImages.rightFoot,
        seriesButtons: seriesButtonImage,
        shadowButton: fixedImages.shadowButton,
        stopButton: fixedImages.stopButton,
        yourGuard: fixedImages.yourGuard
      },
      sounds: soundAssets
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
