(function(root) {
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
      background_images: backgroundImages,
      back_button_image: await loadImage('assets/images/back.png'),
      calibrate_button_image: await loadImage('assets/images/calibrate.png'),
      click_sound: await loadSound('assets/sounds/click.mp3'),
      config_menu_button_image: await loadImage('assets/images/config.png'),
      duration_button_image: durationButtonImage,
      fight_button_image: await loadImage('assets/images/fight.png'),
      fight_menu_button_image: await loadImage('assets/images/fightmenu.png'),
      framerate_button_image: framerateButtonImage,
      good_hit_image: await loadImage('assets/images/good_hit.png'),
      keep_trying_image: await loadImage('assets/images/keep_trying.png'),
      level_button_image: levelButtonImage,
      lfeet_image: await loadImage('assets/images/LFoot.png'),
      logo_image: await loadImage('assets/logos/logo.512.rounded.png'),
      me_image: await loadImage('assets/images/boxers/0-me.png'),
      me_images: meImages,
      menu_image: await loadImage('assets/images/menu_image.png'),
      opponent_image: opponentImage,
      opponents_images: opponentsImages,
      pad_button_image: await loadImage('assets/images/pad.png'),
      punch_sound: await loadSound('assets/sounds/punch.mp3'),
      reset_button_image: await loadImage('assets/images/reset.png'),
      rfeet_image: await loadImage('assets/images/RFoot.png'),
      series_button_image: seriesButtonImage,
      shadow_button_image: await loadImage('assets/images/shadow.png'),
      song_awesome: await loadSound('assets/sounds/awesome.mp3'),
      song_continue: await loadSound('assets/sounds/continue.mp3'),
      song_good: await loadSound('assets/sounds/good.mp3'),
      song_great: await loadSound('assets/sounds/great.mp3'),
      song_keep_trying: await loadSound('assets/sounds/keep_trying.mp3'),
      song_letsfight: await loadSound('assets/sounds/letsfight.mp3'),
      song_perfect: await loadSound('assets/sounds/perfect.mp3'),
      song_thats_it: await loadSound('assets/sounds/thats_it.mp3'),
      song_well_done: await loadSound('assets/sounds/well_done.mp3'),
      song_your_guard: await loadSound('assets/sounds/your_guard.mp3'),
      stop_button_image: await loadImage('assets/images/stop.png'),
      your_guard_image: await loadImage('assets/images/your_guard.png')
    };
  }

  const api = { loadGameAssets };

  root.TfitAssets = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
