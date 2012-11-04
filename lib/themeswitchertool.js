/* jQuery plugin themeswitcher
---------------------------------------------------------------------*/
$.fn.themeswitcher = function(settings){
	var options = jQuery.extend({
		loadTheme: null,
		initialText: 'Switch Theme',
		width: 150,
		height: 200,
		buttonPreText: 'Theme: ',
		closeOnSelect: true,
		buttonHeight: 14,
		cookieName: 'jquery-ui-theme',
		onOpen: function(){},
		onClose: function(){},
		onSelect: function(){}
	}, settings);

	//markup 
	var button = $('<a href="#" class="jquery-ui-themeswitcher-trigger"><span class="jquery-ui-themeswitcher-icon"></span><span class="jquery-ui-themeswitcher-title">'+ options.initialText +'</span></a>');
	var switcherpane = $('<div class="jquery-ui-themeswitcher"><div id="themeGallery">	<ul>		<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Trebuchet+MS,+Tahoma,+Verdana,+Arial,+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.1em&amp;cornerRadius=4px&amp;bgColorHeader=f6a828&amp;bgTextureHeader=12_gloss_wave.png&amp;bgImgOpacityHeader=35&amp;borderColorHeader=e78f08&amp;fcHeader=ffffff&amp;iconColorHeader=ffffff&amp;bgColorContent=eeeeee&amp;bgTextureContent=03_highlight_soft.png&amp;bgImgOpacityContent=100&amp;borderColorContent=dddddd&amp;fcContent=333333&amp;iconColorContent=222222&amp;bgColorDefault=f6f6f6&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=100&amp;borderColorDefault=cccccc&amp;fcDefault=1c94c4&amp;iconColorDefault=ef8c08&amp;bgColorHover=fdf5ce&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=100&amp;borderColorHover=fbcb09&amp;fcHover=c77405&amp;iconColorHover=ef8c08&amp;bgColorActive=ffffff&amp;bgTextureActive=02_glass.png&amp;bgImgOpacityActive=65&amp;borderColorActive=fbd850&amp;fcActive=eb8f00&amp;iconColorActive=ef8c08&amp;bgColorHighlight=ffe45c&amp;bgTextureHighlight=03_highlight_soft.png&amp;bgImgOpacityHighlight=75&amp;borderColorHighlight=fed22f&amp;fcHighlight=363636&amp;iconColorHighlight=228ef1&amp;bgColorError=b81900&amp;bgTextureError=08_diagonals_thick.png&amp;bgImgOpacityError=18&amp;borderColorError=cd0a0a&amp;fcError=ffffff&amp;iconColorError=ffd27a&amp;bgColorOverlay=666666&amp;bgTextureOverlay=08_diagonals_thick.png&amp;bgImgOpacityOverlay=20&amp;opacityOverlay=50&amp;bgColorShadow=000000&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=10&amp;opacityShadow=20&amp;thicknessShadow=5px&amp;offsetTopShadow=-5px&amp;offsetLeftShadow=-5px&amp;cornerRadiusShadow=5px">			<img src="themeswitcher/theme_90_ui_light.png" alt="UI Lightness" title="UI Lightness" />			<span class="themeName">UI lightness</span>		</a></li>				<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Segoe+UI%2C+Arial%2C+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.1em&amp;cornerRadius=6px&amp;bgColorHeader=333333&amp;bgTextureHeader=12_gloss_wave.png&amp;bgImgOpacityHeader=25&amp;borderColorHeader=333333&amp;fcHeader=ffffff&amp;iconColorHeader=ffffff&amp;bgColorContent=000000&amp;bgTextureContent=05_inset_soft.png&amp;bgImgOpacityContent=25&amp;borderColorContent=666666&amp;fcContent=ffffff&amp;iconColorContent=cccccc&amp;bgColorDefault=555555&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=20&amp;borderColorDefault=666666&amp;fcDefault=eeeeee&amp;iconColorDefault=cccccc&amp;bgColorHover=0078a3&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=40&amp;borderColorHover=59b4d4&amp;fcHover=ffffff&amp;iconColorHover=ffffff&amp;bgColorActive=f58400&amp;bgTextureActive=05_inset_soft.png&amp;bgImgOpacityActive=30&amp;borderColorActive=ffaf0f&amp;fcActive=ffffff&amp;iconColorActive=222222&amp;bgColorHighlight=eeeeee&amp;bgTextureHighlight=03_highlight_soft.png&amp;bgImgOpacityHighlight=80&amp;borderColorHighlight=cccccc&amp;fcHighlight=2e7db2&amp;iconColorHighlight=4b8e0b&amp;bgColorError=ffc73d&amp;bgTextureError=02_glass.png&amp;bgImgOpacityError=40&amp;borderColorError=ffb73d&amp;fcError=111111&amp;iconColorError=a83300&amp;bgColorOverlay=5c5c5c&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=50&amp;opacityOverlay=80&amp;bgColorShadow=cccccc&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=30&amp;opacityShadow=60&amp;thicknessShadow=7px&amp;offsetTopShadow=-7px&amp;offsetLeftShadow=-7px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_ui_dark.png" alt="UI Darkness" title="UI Darkness" />			<span class="themeName">UI darkness</span>		</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Verdana,Arial,sans-serif&amp;fwDefault=normal&amp;fsDefault=1.1em&amp;cornerRadius=4px&amp;bgColorHeader=cccccc&amp;bgTextureHeader=03_highlight_soft.png&amp;bgImgOpacityHeader=75&amp;borderColorHeader=aaaaaa&amp;fcHeader=222222&amp;iconColorHeader=222222&amp;bgColorContent=ffffff&amp;bgTextureContent=01_flat.png&amp;bgImgOpacityContent=75&amp;borderColorContent=aaaaaa&amp;fcContent=222222&amp;iconColorContent=222222&amp;bgColorDefault=e6e6e6&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=75&amp;borderColorDefault=d3d3d3&amp;fcDefault=555555&amp;iconColorDefault=888888&amp;bgColorHover=dadada&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=75&amp;borderColorHover=999999&amp;fcHover=212121&amp;iconColorHover=454545&amp;bgColorActive=ffffff&amp;bgTextureActive=02_glass.png&amp;bgImgOpacityActive=65&amp;borderColorActive=aaaaaa&amp;fcActive=212121&amp;iconColorActive=454545&amp;bgColorHighlight=fbf9ee&amp;bgTextureHighlight=02_glass.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=fcefa1&amp;fcHighlight=363636&amp;iconColorHighlight=2e83ff&amp;bgColorError=fef1ec&amp;bgTextureError=02_glass.png&amp;bgImgOpacityError=95&amp;borderColorError=cd0a0a&amp;fcError=cd0a0a&amp;iconColorError=cd0a0a&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=0&amp;opacityOverlay=30&amp;bgColorShadow=aaaaaa&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=0&amp;opacityShadow=30&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_smoothness.png" alt="Smoothness" title="Smoothness" />			<span class="themeName">Smoothness</span>		</a></li>							<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Verdana%2CArial%2Csans-serif&amp;fwDefault=normal&amp;fsDefault=1.1em&amp;cornerRadius=5px&amp;bgColorHeader=2191c0&amp;bgTextureHeader=12_gloss_wave.png&amp;bgImgOpacityHeader=75&amp;borderColorHeader=4297d7&amp;fcHeader=eaf5f7&amp;iconColorHeader=d8e7f3&amp;bgColorContent=fcfdfd&amp;bgTextureContent=06_inset_hard.png&amp;bgImgOpacityContent=100&amp;borderColorContent=a6c9e2&amp;fcContent=222222&amp;iconColorContent=0078ae&amp;bgColorDefault=0078ae&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=45&amp;borderColorDefault=77d5f7&amp;fcDefault=ffffff&amp;iconColorDefault=e0fdff&amp;bgColorHover=79c9ec&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=75&amp;borderColorHover=448dae&amp;fcHover=026890&amp;iconColorHover=056b93&amp;bgColorActive=6eac2c&amp;bgTextureActive=12_gloss_wave.png&amp;bgImgOpacityActive=50&amp;borderColorActive=acdd4a&amp;fcActive=ffffff&amp;iconColorActive=f5e175&amp;bgColorHighlight=f8da4e&amp;bgTextureHighlight=02_glass.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=fcd113&amp;fcHighlight=915608&amp;iconColorHighlight=f7a50d&amp;bgColorError=e14f1c&amp;bgTextureError=12_gloss_wave.png&amp;bgImgOpacityError=45&amp;borderColorError=cd0a0a&amp;fcError=ffffff&amp;iconColorError=fcd113&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=75&amp;opacityOverlay=30&amp;bgColorShadow=999999&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=55&amp;opacityShadow=45&amp;thicknessShadow=0px&amp;offsetTopShadow=5px&amp;offsetLeftShadow=5px&amp;cornerRadiusShadow=5px">			<img src="themeswitcher/theme_90_start_menu.png" alt="Start" title="Start" />			<span class="themeName">Start</span>		</a></li>				<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Lucida+Grande,+Lucida+Sans,+Arial,+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.1em&amp;cornerRadius=5px&amp;bgColorHeader=5c9ccc&amp;bgTextureHeader=12_gloss_wave.png&amp;bgImgOpacityHeader=55&amp;borderColorHeader=4297d7&amp;fcHeader=ffffff&amp;iconColorHeader=d8e7f3&amp;bgColorContent=fcfdfd&amp;bgTextureContent=06_inset_hard.png&amp;bgImgOpacityContent=100&amp;borderColorContent=a6c9e2&amp;fcContent=222222&amp;iconColorContent=469bdd&amp;bgColorDefault=dfeffc&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=85&amp;borderColorDefault=c5dbec&amp;fcDefault=2e6e9e&amp;iconColorDefault=6da8d5&amp;bgColorHover=d0e5f5&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=75&amp;borderColorHover=79b7e7&amp;fcHover=1d5987&amp;iconColorHover=217bc0&amp;bgColorActive=f5f8f9&amp;bgTextureActive=06_inset_hard.png&amp;bgImgOpacityActive=100&amp;borderColorActive=79b7e7&amp;fcActive=e17009&amp;iconColorActive=f9bd01&amp;bgColorHighlight=fbec88&amp;bgTextureHighlight=01_flat.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=fad42e&amp;fcHighlight=363636&amp;iconColorHighlight=2e83ff&amp;bgColorError=fef1ec&amp;bgTextureError=02_glass.png&amp;bgImgOpacityError=95&amp;borderColorError=cd0a0a&amp;fcError=cd0a0a&amp;iconColorError=cd0a0a&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=0&amp;opacityOverlay=30&amp;bgColorShadow=aaaaaa&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=0&amp;opacityShadow=30&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_windoze.png" alt="Redmond" title="Redmond" />			<span class="themeName">Redmond</span>		</a></li>						<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Segoe+UI%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=8px&bgColorHeader=817865&bgTextureHeader=12_gloss_wave.png&bgImgOpacityHeader=45&borderColorHeader=494437&fcHeader=ffffff&iconColorHeader=fadc7a&bgColorContent=feeebd&bgTextureContent=03_highlight_soft.png&bgImgOpacityContent=100&borderColorContent=8e846b&fcContent=383838&iconColorContent=d19405&bgColorDefault=fece2f&bgTextureDefault=12_gloss_wave.png&bgImgOpacityDefault=60&borderColorDefault=d19405&fcDefault=4c3000&iconColorDefault=3d3d3d&bgColorHover=ffdd57&bgTextureHover=12_gloss_wave.png&bgImgOpacityHover=70&borderColorHover=a45b13&fcHover=381f00&iconColorHover=bd7b00&bgColorActive=ffffff&bgTextureActive=05_inset_soft.png&bgImgOpacityActive=30&borderColorActive=655e4e&fcActive=0074c7&iconColorActive=eb990f&bgColorHighlight=fff9e5&bgTextureHighlight=12_gloss_wave.png&bgImgOpacityHighlight=90&borderColorHighlight=eeb420&fcHighlight=1f1f1f&iconColorHighlight=ed9f26&bgColorError=d34d17&bgTextureError=07_diagonals_medium.png&bgImgOpacityError=20&borderColorError=ffb73d&fcError=ffffff&iconColorError=ffe180&bgColorOverlay=5c5c5c&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=50&opacityOverlay=80&bgColorShadow=cccccc&bgTextureShadow=01_flat.png&bgImgOpacityShadow=30&opacityShadow=60&thicknessShadow=7px&offsetTopShadow=-7px&offsetLeftShadow=-7px&cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_sunny.png" alt="Sunny" title="Sunny" />			<span class="themeName">Sunny</span>		</a></li>						<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Trebuchet+MS%2C+Helvetica%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=dddddd&bgTextureHeader=02_glass.png&bgImgOpacityHeader=35&borderColorHeader=bbbbbb&fcHeader=444444&iconColorHeader=999999&bgColorContent=c9c9c9&bgTextureContent=05_inset_soft.png&bgImgOpacityContent=50&borderColorContent=aaaaaa&fcContent=333333&iconColorContent=999999&bgColorDefault=eeeeee&bgTextureDefault=02_glass.png&bgImgOpacityDefault=60&borderColorDefault=cccccc&fcDefault=3383bb&iconColorDefault=70b2e1&bgColorHover=f8f8f8&bgTextureHover=02_glass.png&bgImgOpacityHover=100&borderColorHover=bbbbbb&fcHover=599fcf&iconColorHover=3383bb&bgColorActive=999999&bgTextureActive=06_inset_hard.png&bgImgOpacityActive=75&borderColorActive=999999&fcActive=ffffff&iconColorActive=454545&bgColorHighlight=eeeeee&bgTextureHighlight=01_flat.png&bgImgOpacityHighlight=55&borderColorHighlight=ffffff&fcHighlight=444444&iconColorHighlight=3383bb&bgColorError=c0402a&bgTextureError=01_flat.png&bgImgOpacityError=55&borderColorError=c0402a&fcError=ffffff&iconColorError=fbc856&bgColorOverlay=eeeeee&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=0&opacityOverlay=80&bgColorShadow=aaaaaa&bgTextureShadow=01_flat.png&bgImgOpacityShadow=0&opacityShadow=60&thicknessShadow=4px&offsetTopShadow=-4px&offsetLeftShadow=-4px&cornerRadiusShadow=0pxdow%3D0px">			<img src="themeswitcher/theme_90_overcast.png" alt="Overcast" title="Overcast" />			<span class="themeName">Overcast</span>				</a></li>						<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Lucida+Grande%2C+Lucida+Sans%2C+Arial%2C+sans-serif&fwDefault=normal&fsDefault=1.1em&cornerRadius=10px&bgColorHeader=3a8104&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=33&borderColorHeader=3f7506&fcHeader=ffffff&iconColorHeader=ffffff&bgColorContent=285c00&bgTextureContent=05_inset_soft.png&bgImgOpacityContent=10&borderColorContent=72b42d&fcContent=ffffff&iconColorContent=72b42d&bgColorDefault=4ca20b&bgTextureDefault=03_highlight_soft.png&bgImgOpacityDefault=60&borderColorDefault=45930b&fcDefault=ffffff&iconColorDefault=ffffff&bgColorHover=4eb305&bgTextureHover=03_highlight_soft.png&bgImgOpacityHover=50&borderColorHover=8bd83b&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=285c00&bgTextureActive=04_highlight_hard.png&bgImgOpacityActive=30&borderColorActive=72b42d&fcActive=ffffff&iconColorActive=ffffff&bgColorHighlight=fbf5d0&bgTextureHighlight=02_glass.png&bgImgOpacityHighlight=55&borderColorHighlight=f9dd34&fcHighlight=363636&iconColorHighlight=4eb305&bgColorError=ffdc2e&bgTextureError=08_diagonals_thick.png&bgImgOpacityError=95&borderColorError=fad000&fcError=2b2b2b&iconColorError=cd0a0a&bgColorOverlay=444444&bgTextureOverlay=08_diagonals_thick.png&bgImgOpacityOverlay=15&opacityOverlay=30&bgColorShadow=aaaaaa&bgTextureShadow=07_diagonals_small.png&bgImgOpacityShadow=0&opacityShadow=30&thicknessShadow=0px&offsetTopShadow=4px&offsetLeftShadow=4px&cornerRadiusShadow=4px">			<img src="themeswitcher/theme_90_le_frog.png" alt="Le Frog" title="Le Frog" />			<span class="themeName">Le Frog</span>		</a></li>								<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Helvetica%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=2px&bgColorHeader=dddddd&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=50&borderColorHeader=dddddd&fcHeader=444444&iconColorHeader=0073ea&bgColorContent=ffffff&bgTextureContent=01_flat.png&bgImgOpacityContent=75&borderColorContent=dddddd&fcContent=444444&iconColorContent=ff0084&bgColorDefault=f6f6f6&bgTextureDefault=03_highlight_soft.png&bgImgOpacityDefault=100&borderColorDefault=dddddd&fcDefault=0073ea&iconColorDefault=666666&bgColorHover=0073ea&bgTextureHover=03_highlight_soft.png&bgImgOpacityHover=25&borderColorHover=0073ea&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=ffffff&bgTextureActive=02_glass.png&bgImgOpacityActive=65&borderColorActive=dddddd&fcActive=ff0084&iconColorActive=454545&bgColorHighlight=ffffff&bgTextureHighlight=01_flat.png&bgImgOpacityHighlight=55&borderColorHighlight=cccccc&fcHighlight=444444&iconColorHighlight=0073ea&bgColorError=ffffff&bgTextureError=01_flat.png&bgImgOpacityError=55&borderColorError=ff0084&fcError=222222&iconColorError=ff0084&bgColorOverlay=eeeeee&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=0&opacityOverlay=80&bgColorShadow=aaaaaa&bgTextureShadow=01_flat.png&bgImgOpacityShadow=0&opacityShadow=60&thicknessShadow=4px&offsetTopShadow=-4px&offsetLeftShadow=-4px&cornerRadiusShadow=0px">			<img src="themeswitcher/theme_90_flick.png" alt="Flick" title="Flick" />			<span class="themeName">Flick</span>				</a></li>				<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Trebuchet+MS%2C+Tahoma%2C+Verdana%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=ffffff&bgTextureHeader=23_fine_grain.png&bgImgOpacityHeader=15&borderColorHeader=d4d1bf&fcHeader=453821&iconColorHeader=b83400&bgColorContent=eceadf&bgTextureContent=23_fine_grain.png&bgImgOpacityContent=10&borderColorContent=d9d6c4&fcContent=1f1f1f&iconColorContent=222222&bgColorDefault=f8f7f6&bgTextureDefault=23_fine_grain.png&bgImgOpacityDefault=10&borderColorDefault=cbc7bd&fcDefault=654b24&iconColorDefault=b83400&bgColorHover=654b24&bgTextureHover=23_fine_grain.png&bgImgOpacityHover=65&borderColorHover=654b24&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=eceadf&bgTextureActive=23_fine_grain.png&bgImgOpacityActive=15&borderColorActive=d9d6c4&fcActive=140f06&iconColorActive=8c291d&bgColorHighlight=f7f3de&bgTextureHighlight=23_fine_grain.png&bgImgOpacityHighlight=15&borderColorHighlight=b2a266&fcHighlight=3a3427&iconColorHighlight=3572ac&bgColorError=b83400&bgTextureError=23_fine_grain.png&bgImgOpacityError=68&borderColorError=681818&fcError=ffffff&iconColorError=fbdb93&bgColorOverlay=6e4f1c&bgTextureOverlay=16_diagonal_maze.png&bgImgOpacityOverlay=20&opacityOverlay=60&bgColorShadow=000000&bgTextureShadow=16_diagonal_maze.png&bgImgOpacityShadow=40&opacityShadow=60&thicknessShadow=5px&offsetTopShadow=0&offsetLeftShadow=-10px&cornerRadiusShadow=18px">			<img src="themeswitcher/theme_90_pepper_grinder.png" alt="Pepper Grinder" title="Pepper Grinder" />			<span class="themeName">Pepper Grinder</span>				</a></li>								<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Lucida+Grande%2C+Lucida+Sans%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=30273a&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=25&borderColorHeader=231d2b&fcHeader=ffffff&iconColorHeader=a8a3ae&bgColorContent=3d3644&bgTextureContent=12_gloss_wave.png&bgImgOpacityContent=30&borderColorContent=7e7783&fcContent=ffffff&iconColorContent=ffffff&bgColorDefault=dcd9de&bgTextureDefault=03_highlight_soft.png&bgImgOpacityDefault=100&borderColorDefault=dcd9de&fcDefault=665874&iconColorDefault=8d78a5&bgColorHover=eae6ea&bgTextureHover=03_highlight_soft.png&bgImgOpacityHover=100&borderColorHover=d1c5d8&fcHover=734d99&iconColorHover=734d99&bgColorActive=5f5964&bgTextureActive=03_highlight_soft.png&bgImgOpacityActive=45&borderColorActive=7e7783&fcActive=ffffff&iconColorActive=454545&bgColorHighlight=fafafa&bgTextureHighlight=01_flat.png&bgImgOpacityHighlight=55&borderColorHighlight=ffdb1f&fcHighlight=333333&iconColorHighlight=8d78a5&bgColorError=994d53&bgTextureError=01_flat.png&bgImgOpacityError=55&borderColorError=994d53&fcError=ffffff&iconColorError=ebccce&bgColorOverlay=eeeeee&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=0&opacityOverlay=80&bgColorShadow=aaaaaa&bgTextureShadow=01_flat.png&bgImgOpacityShadow=0&opacityShadow=60&thicknessShadow=4px&offsetTopShadow=-4px&offsetLeftShadow=-4px&cornerRadiusShadow=0px">			<img src="themeswitcher/theme_90_eggplant.png" alt="Eggplant" title="Eggplant" />			<span class="themeName">Eggplant</span>				</a></li>								<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Verdana%2C+Arial%2C+sans-serif&fwDefault=normal&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=444444&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=44&borderColorHeader=333333&fcHeader=ffffff&iconColorHeader=ffffff&bgColorContent=000000&bgTextureContent=14_loop.png&bgImgOpacityContent=25&borderColorContent=555555&fcContent=ffffff&iconColorContent=cccccc&bgColorDefault=222222&bgTextureDefault=03_highlight_soft.png&bgImgOpacityDefault=35&borderColorDefault=444444&fcDefault=eeeeee&iconColorDefault=cccccc&bgColorHover=003147&bgTextureHover=03_highlight_soft.png&bgImgOpacityHover=33&borderColorHover=0b93d5&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=0972a5&bgTextureActive=04_highlight_hard.png&bgImgOpacityActive=20&borderColorActive=26b3f7&fcActive=ffffff&iconColorActive=222222&bgColorHighlight=eeeeee&bgTextureHighlight=03_highlight_soft.png&bgImgOpacityHighlight=80&borderColorHighlight=cccccc&fcHighlight=2e7db2&iconColorHighlight=4b8e0b&bgColorError=ffc73d&bgTextureError=02_glass.png&bgImgOpacityError=40&borderColorError=ffb73d&fcError=111111&iconColorError=a83300&bgColorOverlay=5c5c5c&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=50&opacityOverlay=80&bgColorShadow=cccccc&bgTextureShadow=01_flat.png&bgImgOpacityShadow=30&opacityShadow=60&thicknessShadow=7px&offsetTopShadow=-7px&offsetLeftShadow=-7px&cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_dark_hive.png" alt="Dark Hive" title="Dark Hive" />			<span class="themeName">Dark Hive</span>		</a></li>										<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Lucida+Grande%2C+Lucida+Sans%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=deedf7&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=100&borderColorHeader=aed0ea&fcHeader=222222&iconColorHeader=72a7cf&bgColorContent=f2f5f7&bgTextureContent=04_highlight_hard.png&bgImgOpacityContent=100&borderColorContent=dddddd&fcContent=362b36&iconColorContent=72a7cf&bgColorDefault=d7ebf9&bgTextureDefault=02_glass.png&bgImgOpacityDefault=80&borderColorDefault=aed0ea&fcDefault=2779aa&iconColorDefault=3d80b3&bgColorHover=e4f1fb&bgTextureHover=02_glass.png&bgImgOpacityHover=100&borderColorHover=74b2e2&fcHover=0070a3&iconColorHover=2694e8&bgColorActive=3baae3&bgTextureActive=02_glass.png&bgImgOpacityActive=50&borderColorActive=2694e8&fcActive=ffffff&iconColorActive=ffffff&bgColorHighlight=ffef8f&bgTextureHighlight=03_highlight_soft.png&bgImgOpacityHighlight=25&borderColorHighlight=f9dd34&fcHighlight=363636&iconColorHighlight=2e83ff&bgColorError=cd0a0a&bgTextureError=01_flat.png&bgImgOpacityError=15&borderColorError=cd0a0a&fcError=ffffff&iconColorError=ffffff&bgColorOverlay=eeeeee&bgTextureOverlay=08_diagonals_thick.png&bgImgOpacityOverlay=90&opacityOverlay=80&bgColorShadow=000000&bgTextureShadow=04_highlight_hard.png&bgImgOpacityShadow=70&opacityShadow=30&thicknessShadow=7px&offsetTopShadow=-7px&offsetLeftShadow=-7px&cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_cupertino.png" alt="Cupertino" title="Cupertino" />			<span class="themeName">Cupertino</span>				</a></li>				<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=segoe+ui%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=ece8da&bgTextureHeader=12_gloss_wave.png&bgImgOpacityHeader=100&borderColorHeader=d4ccb0&fcHeader=433f38&iconColorHeader=847e71&bgColorContent=f5f3e5&bgTextureContent=04_highlight_hard.png&bgImgOpacityContent=100&borderColorContent=dfd9c3&fcContent=312e25&iconColorContent=808080&bgColorDefault=459e00&bgTextureDefault=04_highlight_hard.png&bgImgOpacityDefault=15&borderColorDefault=327E04&fcDefault=ffffff&iconColorDefault=eeeeee&bgColorHover=67b021&bgTextureHover=03_highlight_soft.png&bgImgOpacityHover=25&borderColorHover=327E04&fcHover=ffffff&iconColorHover=ffffff&bgColorActive=fafaf4&bgTextureActive=04_highlight_hard.png&bgImgOpacityActive=100&borderColorActive=d4ccb0&fcActive=459e00&iconColorActive=8DC262&bgColorHighlight=fcf0ba&bgTextureHighlight=02_glass.png&bgImgOpacityHighlight=55&borderColorHighlight=e8e1b5&fcHighlight=363636&iconColorHighlight=8DC262&bgColorError=ffedad&bgTextureError=03_highlight_soft.png&bgImgOpacityError=95&borderColorError=e3a345&fcError=cd5c0a&iconColorError=cd0a0a&bgColorOverlay=2b2922&bgTextureOverlay=05_inset_soft.png&bgImgOpacityOverlay=15&opacityOverlay=90&bgColorShadow=cccccc&bgTextureShadow=04_highlight_hard.png&bgImgOpacityShadow=95&opacityShadow=20&thicknessShadow=12px&offsetTopShadow=-12px&offsetLeftShadow=-12px&cornerRadiusShadow=10px">			<img src="themeswitcher/theme_90_south_street.png" alt="South St" title="South St" />			<span class="themeName">South Street</span>				</a></li>		<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Arial,sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=cc0000&bgTextureHeader=03_highlight_soft.png&bgImgOpacityHeader=15&borderColorHeader=e3a1a1&fcHeader=ffffff&iconColorHeader=ffffff&bgColorContent=ffffff&bgTextureContent=01_flat.png&bgImgOpacityContent=75&borderColorContent=eeeeee&fcContent=333333&iconColorContent=cc0000&bgColorDefault=eeeeee&bgTextureDefault=04_highlight_hard.png&bgImgOpacityDefault=100&borderColorDefault=d8dcdf&fcDefault=004276&iconColorDefault=cc0000&bgColorHover=f6f6f6&bgTextureHover=04_highlight_hard.png&bgImgOpacityHover=100&borderColorHover=cdd5da&fcHover=111111&iconColorHover=cc0000&bgColorActive=ffffff&bgTextureActive=01_flat.png&bgImgOpacityActive=65&borderColorActive=eeeeee&fcActive=cc0000&iconColorActive=cc0000&bgColorHighlight=fbf8ee&bgTextureHighlight=02_glass.png&bgImgOpacityHighlight=55&borderColorHighlight=fcd3a1&fcHighlight=444444&iconColorHighlight=004276&bgColorError=f3d8d8&bgTextureError=08_diagonals_thick.png&bgImgOpacityError=75&borderColorError=cc0000&fcError=2e2e2e&iconColorError=cc0000&bgColorOverlay=a6a6a6&bgTextureOverlay=09_dots_small.png&bgImgOpacityOverlay=65&opacityOverlay=40&bgColorShadow=333333&bgTextureShadow=01_flat.png&bgImgOpacityShadow=0&opacityShadow=10&thicknessShadow=8px&offsetTopShadow=-8px&offsetLeftShadow=-8px&cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_blitzer.png" alt="Blitzer" title="Blitzer" />			<span class="themeName">Blitzer</span>		</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?tr=ffDefault=Helvetica,Arial,sans-serif&amp;fwDefault=normal&amp;fsDefault=1.1em&amp;cornerRadius=6px&amp;bgColorHeader=cb842e&amp;bgTextureHeader=02_glass.png&amp;bgImgOpacityHeader=25&amp;borderColorHeader=d49768&amp;fcHeader=ffffff&amp;iconColorHeader=ffffff&amp;bgColorContent=f4f0ec&amp;bgTextureContent=05_inset_soft.png&amp;bgImgOpacityContent=100&amp;borderColorContent=e0cfc2&amp;fcContent=1e1b1d&amp;iconColorContent=c47a23&amp;bgColorDefault=ede4d4&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=70&amp;borderColorDefault=cdc3b7&amp;fcDefault=3f3731&amp;iconColorDefault=f08000&amp;bgColorHover=f5f0e5&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=100&amp;borderColorHover=f5ad66&amp;fcHover=a46313&amp;iconColorHover=f08000&amp;bgColorActive=f4f0ec&amp;bgTextureActive=04_highlight_hard.png&amp;bgImgOpacityActive=100&amp;borderColorActive=e0cfc2&amp;fcActive=b85700&amp;iconColorActive=f35f07&amp;bgColorHighlight=f5f5b5&amp;bgTextureHighlight=04_highlight_hard.png&amp;bgImgOpacityHighlight=75&amp;borderColorHighlight=d9bb73&amp;fcHighlight=060200&amp;iconColorHighlight=cb672b&amp;bgColorError=fee4bd&amp;bgTextureError=04_highlight_hard.png&amp;bgImgOpacityError=65&amp;borderColorError=f8893f&amp;fcError=592003&amp;iconColorError=ff7519&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=75&amp;opacityOverlay=30&amp;bgColorShadow=aaaaaa&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=75&amp;opacityShadow=30&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_humanity.png" alt="Humanity" title="Humanity" />			<span class="themeName">Humanity</span>		</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Gill+Sans,Arial,sans-serif&amp;fwDefault=bold&amp;fsDefault=1.2em&amp;cornerRadius=4px&amp;bgColorHeader=35414f&amp;bgTextureHeader=09_dots_small.png&amp;bgImgOpacityHeader=35&amp;borderColorHeader=2c4359&amp;fcHeader=e1e463&amp;iconColorHeader=e1e463&amp;bgColorContent=ffffff&amp;bgTextureContent=01_flat.png&amp;bgImgOpacityContent=75&amp;borderColorContent=aaaaaa&amp;fcContent=2c4359&amp;iconColorContent=c02669&amp;bgColorDefault=93c3cd&amp;bgTextureDefault=07_diagonals_small.png&amp;bgImgOpacityDefault=50&amp;borderColorDefault=93c3cd&amp;fcDefault=333333&amp;iconColorDefault=ffffff&amp;bgColorHover=ccd232&amp;bgTextureHover=07_diagonals_small.png&amp;bgImgOpacityHover=75&amp;borderColorHover=999999&amp;fcHover=212121&amp;iconColorHover=454545&amp;bgColorActive=db4865&amp;bgTextureActive=07_diagonals_small.png&amp;bgImgOpacityActive=40&amp;borderColorActive=ff6b7f&amp;fcActive=ffffff&amp;iconColorActive=ffffff&amp;bgColorHighlight=ffff38&amp;bgTextureHighlight=10_dots_medium.png&amp;bgImgOpacityHighlight=80&amp;borderColorHighlight=b4d100&amp;fcHighlight=363636&amp;iconColorHighlight=88a206&amp;bgColorError=ff3853&amp;bgTextureError=07_diagonals_small.png&amp;bgImgOpacityError=50&amp;borderColorError=ff6b7f&amp;fcError=ffffff&amp;iconColorError=ffeb33&amp;bgColorOverlay=f7f7ba&amp;bgTextureOverlay=11_white_lines.png&amp;bgImgOpacityOverlay=85&amp;opacityOverlay=80&amp;bgColorShadow=ba9217&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=75&amp;opacityShadow=20&amp;thicknessShadow=10px&amp;offsetTopShadow=8px&amp;offsetLeftShadow=8px&amp;cornerRadiusShadow=5px">		<img src="themeswitcher/theme_90_hot_sneaks.png" alt="Hot Sneaks" title="Hot Sneaks" />			<span class="themeName">Hot sneaks</span>		</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=segoe+ui,+Arial,+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.1em&amp;cornerRadius=3px&amp;bgColorHeader=f9f9f9&amp;bgTextureHeader=03_highlight_soft.png&amp;bgImgOpacityHeader=100&amp;borderColorHeader=cccccc&amp;fcHeader=e69700&amp;iconColorHeader=5fa5e3&amp;bgColorContent=eeeeee&amp;bgTextureContent=06_inset_hard.png&amp;bgImgOpacityContent=100&amp;borderColorContent=aaaaaa&amp;fcContent=222222&amp;iconColorContent=0a82eb&amp;bgColorDefault=1484e6&amp;bgTextureDefault=08_diagonals_thick.png&amp;bgImgOpacityDefault=22&amp;borderColorDefault=ffffff&amp;fcDefault=ffffff&amp;iconColorDefault=fcdd4a&amp;bgColorHover=2293f7&amp;bgTextureHover=08_diagonals_thick.png&amp;bgImgOpacityHover=26&amp;borderColorHover=2293f7&amp;fcHover=ffffff&amp;iconColorHover=ffffff&amp;bgColorActive=e69700&amp;bgTextureActive=08_diagonals_thick.png&amp;bgImgOpacityActive=20&amp;borderColorActive=e69700&amp;fcActive=ffffff&amp;iconColorActive=ffffff&amp;bgColorHighlight=c5ddfc&amp;bgTextureHighlight=07_diagonals_small.png&amp;bgImgOpacityHighlight=25&amp;borderColorHighlight=ffffff&amp;fcHighlight=333333&amp;iconColorHighlight=0b54d5&amp;bgColorError=e69700&amp;bgTextureError=08_diagonals_thick.png&amp;bgImgOpacityError=20&amp;borderColorError=e69700&amp;fcError=ffffff&amp;iconColorError=ffffff&amp;bgColorOverlay=e6b900&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=0&amp;opacityOverlay=30&amp;bgColorShadow=e69700&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=0&amp;opacityShadow=20&amp;thicknessShadow=0px&amp;offsetTopShadow=6px&amp;offsetLeftShadow=6px&amp;cornerRadiusShadow=3px">			<img src="themeswitcher/theme_90_excite_bike.png" alt="Excite Bike" title="Excite Bike" />			<span class="themeName">Excite Bike</span>			</a></li>		<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?tr&amp;ffDefault=Helvetica,+Arial,+sans-serif&amp;fwDefault=normal&amp;fsDefault=1.1&amp;fsDefaultUnit=em&amp;cornerRadius=5&amp;cornerRadiusUnit=px&amp;bgColorHeader=888888&amp;bgTextureHeader=04_highlight_hard.png&amp;bgImgOpacityHeader=15&amp;borderColorHeader=404040&amp;fcHeader=ffffff&amp;iconColorHeader=cccccc&amp;bgColorContent=121212&amp;bgTextureContent=12_gloss_wave.png&amp;bgImgOpacityContent=16&amp;borderColorContent=404040&amp;fcContent=eeeeee&amp;iconColorContent=bbbbbb&amp;bgColorDefault=adadad&amp;bgTextureDefault=03_highlight_soft.png&amp;bgImgOpacityDefault=35&amp;borderColorDefault=cccccc&amp;fcDefault=333333&amp;iconColorDefault=666666&amp;bgColorHover=dddddd&amp;bgTextureHover=03_highlight_soft.png&amp;bgImgOpacityHover=60&amp;borderColorHover=dddddd&amp;fcHover=000000&amp;iconColorHover=c98000&amp;bgColorActive=121212&amp;bgTextureActive=05_inset_soft.png&amp;bgImgOpacityActive=15&amp;borderColorActive=000000&amp;fcActive=ffffff&amp;iconColorActive=f29a00&amp;bgColorHighlight=555555&amp;bgTextureHighlight=04_highlight_hard.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=404040&amp;fcHighlight=cccccc&amp;iconColorHighlight=aaaaaa&amp;bgColorError=fef1ec&amp;bgTextureError=02_glass.png&amp;bgImgOpacityError=95&amp;borderColorError=cd0a0a&amp;fcError=cd0a0a&amp;iconColorError=cd0a0a">			<img src="themeswitcher/theme_90_black_matte.png" alt="Vader" title="Vader" />			<span class="themeName">Vader</span>			</a></li>				<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Arial,+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.3em&amp;cornerRadius=4px&amp;bgColorHeader=0b3e6f&amp;bgTextureHeader=08_diagonals_thick.png&amp;bgImgOpacityHeader=15&amp;borderColorHeader=0b3e6f&amp;fcHeader=f6f6f6&amp;iconColorHeader=98d2fb&amp;bgColorContent=111111&amp;bgTextureContent=12_gloss_wave.png&amp;bgImgOpacityContent=20&amp;borderColorContent=000000&amp;fcContent=d9d9d9&amp;iconColorContent=9ccdfc&amp;bgColorDefault=333333&amp;bgTextureDefault=09_dots_small.png&amp;bgImgOpacityDefault=20&amp;borderColorDefault=333333&amp;fcDefault=ffffff&amp;iconColorDefault=9ccdfc&amp;bgColorHover=00498f&amp;bgTextureHover=09_dots_small.png&amp;bgImgOpacityHover=40&amp;borderColorHover=222222&amp;fcHover=ffffff&amp;iconColorHover=ffffff&amp;bgColorActive=292929&amp;bgTextureActive=01_flat.png&amp;bgImgOpacityActive=40&amp;borderColorActive=096ac8&amp;fcActive=75abff&amp;iconColorActive=00498f&amp;bgColorHighlight=0b58a2&amp;bgTextureHighlight=10_dots_medium.png&amp;bgImgOpacityHighlight=30&amp;borderColorHighlight=052f57&amp;fcHighlight=ffffff&amp;iconColorHighlight=ffffff&amp;bgColorError=a32d00&amp;bgTextureError=09_dots_small.png&amp;bgImgOpacityError=30&amp;borderColorError=cd0a0a&amp;fcError=ffffff&amp;iconColorError=ffffff&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=01_flat.png&amp;bgImgOpacityOverlay=0&amp;opacityOverlay=30&amp;bgColorShadow=aaaaaa&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=0&amp;opacityShadow=30&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_dot_luv.png" alt="Dot Luv" title="Dot Luv" />			<span class="themeName">Dot Luv</span>			</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Segoe+UI%2C+Helvetica%2C+Arial%2C+sans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=4px&bgColorHeader=453326&bgTextureHeader=12_gloss_wave.png&bgImgOpacityHeader=25&borderColorHeader=695649&fcHeader=e3ddc9&iconColorHeader=e3ddc9&bgColorContent=201913&bgTextureContent=05_inset_soft.png&bgImgOpacityContent=10&borderColorContent=9c947c&fcContent=ffffff&iconColorContent=222222&bgColorDefault=1c160d&bgTextureDefault=12_gloss_wave.png&bgImgOpacityDefault=20&borderColorDefault=695444&fcDefault=9bcc60&iconColorDefault=9bcc60&bgColorHover=44372c&bgTextureHover=12_gloss_wave.png&bgImgOpacityHover=30&borderColorHover=9c947c&fcHover=baec7e&iconColorHover=add978&bgColorActive=201913&bgTextureActive=03_highlight_soft.png&bgImgOpacityActive=20&borderColorActive=9c947c&fcActive=e3ddc9&iconColorActive=e3ddc9&bgColorHighlight=619226&bgTextureHighlight=03_highlight_soft.png&bgImgOpacityHighlight=20&borderColorHighlight=add978&fcHighlight=ffffff&iconColorHighlight=ffffff&bgColorError=5f391b&bgTextureError=02_glass.png&bgImgOpacityError=15&borderColorError=5f391b&fcError=ffffff&iconColorError=f1fd86&bgColorOverlay=aaaaaa&bgTextureOverlay=01_flat.png&bgImgOpacityOverlay=0&opacityOverlay=30&bgColorShadow=aaaaaa&bgTextureShadow=01_flat.png&bgImgOpacityShadow=0&opacityShadow=30&thicknessShadow=8px&offsetTopShadow=-8px&offsetLeftShadow=-8px&cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_mint_choco.png" alt="Mint Choc" title="Mint Choc" />			<span class="themeName">Mint Choc</span>		</a></li>		<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Verdana,+Arial,+sans-serif&amp;fwDefault=normal&amp;fsDefault=1.1em&amp;cornerRadius=4px&amp;bgColorHeader=333333&amp;bgTextureHeader=08_diagonals_thick.png&amp;bgImgOpacityHeader=8&amp;borderColorHeader=a3a3a3&amp;fcHeader=eeeeee&amp;iconColorHeader=bbbbbb&amp;bgColorContent=f9f9f9&amp;bgTextureContent=04_highlight_hard.png&amp;bgImgOpacityContent=100&amp;borderColorContent=cccccc&amp;fcContent=222222&amp;iconColorContent=222222&amp;bgColorDefault=111111&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=40&amp;borderColorDefault=777777&amp;fcDefault=e3e3e3&amp;iconColorDefault=ededed&amp;bgColorHover=1c1c1c&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=55&amp;borderColorHover=000000&amp;fcHover=ffffff&amp;iconColorHover=ffffff&amp;bgColorActive=ffffff&amp;bgTextureActive=01_flat.png&amp;bgImgOpacityActive=65&amp;borderColorActive=cccccc&amp;fcActive=222222&amp;iconColorActive=222222&amp;bgColorHighlight=ffeb80&amp;bgTextureHighlight=06_inset_hard.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=ffde2e&amp;fcHighlight=363636&amp;iconColorHighlight=4ca300&amp;bgColorError=cd0a0a&amp;bgTextureError=06_inset_hard.png&amp;bgImgOpacityError=45&amp;borderColorError=9e0505&amp;fcError=ffffff&amp;iconColorError=ffcf29&amp;bgColorOverlay=aaaaaa&amp;bgTextureOverlay=04_highlight_hard.png&amp;bgImgOpacityOverlay=40&amp;opacityOverlay=30&amp;bgColorShadow=aaaaaa&amp;bgTextureShadow=03_highlight_soft.png&amp;bgImgOpacityShadow=50&amp;opacityShadow=20&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=8px">			<img src="themeswitcher/theme_90_black_tie.png" alt="Black Tie" title="Black Tie" />			<span class="themeName">Black Tie</span>		</a></li>		<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Segoe+UI,+Helvetica,+Arial,+sans-serif&amp;fwDefault=bold&amp;fsDefault=1.1em&amp;cornerRadius=6px&amp;bgColorHeader=9fda58&amp;bgTextureHeader=12_gloss_wave.png&amp;bgImgOpacityHeader=85&amp;borderColorHeader=000000&amp;fcHeader=222222&amp;iconColorHeader=1f1f1f&amp;bgColorContent=000000&amp;bgTextureContent=12_gloss_wave.png&amp;bgImgOpacityContent=55&amp;borderColorContent=4a4a4a&amp;fcContent=ffffff&amp;iconColorContent=9fda58&amp;bgColorDefault=0a0a0a&amp;bgTextureDefault=02_glass.png&amp;bgImgOpacityDefault=40&amp;borderColorDefault=1b1613&amp;fcDefault=b8ec79&amp;iconColorDefault=b8ec79&amp;bgColorHover=000000&amp;bgTextureHover=02_glass.png&amp;bgImgOpacityHover=60&amp;borderColorHover=000000&amp;fcHover=96f226&amp;iconColorHover=b8ec79&amp;bgColorActive=4c4c4c&amp;bgTextureActive=01_flat.png&amp;bgImgOpacityActive=0&amp;borderColorActive=696969&amp;fcActive=ffffff&amp;iconColorActive=ffffff&amp;bgColorHighlight=f1fbe5&amp;bgTextureHighlight=02_glass.png&amp;bgImgOpacityHighlight=55&amp;borderColorHighlight=8cce3b&amp;fcHighlight=030303&amp;iconColorHighlight=000000&amp;bgColorError=f6ecd5&amp;bgTextureError=12_gloss_wave.png&amp;bgImgOpacityError=95&amp;borderColorError=f1ac88&amp;fcError=74736d&amp;iconColorError=cd0a0a&amp;bgColorOverlay=262626&amp;bgTextureOverlay=07_diagonals_small.png&amp;bgImgOpacityOverlay=50&amp;opacityOverlay=30&amp;bgColorShadow=303030&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=0&amp;opacityShadow=50&amp;thicknessShadow=6px&amp;offsetTopShadow=-6px&amp;offsetLeftShadow=-6px&amp;cornerRadiusShadow=12px">			<img src="themeswitcher/theme_90_trontastic.png" alt="Trontastic" title="Trontastic" />			<span class="themeName">Trontastic</span>			</a></li>			<li><a href="http://jqueryui.com/themeroller/css/parseTheme.css.php?ffDefault=Georgia%2C+Verdana%2CArial%2Csans-serif&amp;fwDefault=bold&amp;fsDefault=1.2em&amp;cornerRadius=5px&amp;bgColorHeader=261803&amp;bgTextureHeader=13_diamond.png&amp;bgImgOpacityHeader=8&amp;borderColorHeader=baaa5a&amp;fcHeader=eacd86&amp;iconColorHeader=e9cd86&amp;bgColorContent=443113&amp;bgTextureContent=13_diamond.png&amp;bgImgOpacityContent=8&amp;borderColorContent=efec9f&amp;fcContent=efec9f&amp;iconColorContent=efec9f&amp;bgColorDefault=4f4221&amp;bgTextureDefault=13_diamond.png&amp;bgImgOpacityDefault=10&amp;borderColorDefault=362917&amp;fcDefault=f8eec9&amp;iconColorDefault=e8e2b5&amp;bgColorHover=675423&amp;bgTextureHover=13_diamond.png&amp;bgImgOpacityHover=25&amp;borderColorHover=362917&amp;fcHover=f8eec9&amp;iconColorHover=f2ec64&amp;bgColorActive=443113&amp;bgTextureActive=13_diamond.png&amp;bgImgOpacityActive=8&amp;borderColorActive=efec9f&amp;fcActive=f9f2bd&amp;iconColorActive=f9f2bd&amp;bgColorHighlight=d5ac5d&amp;bgTextureHighlight=13_diamond.png&amp;bgImgOpacityHighlight=25&amp;borderColorHighlight=362917&amp;fcHighlight=060200&amp;iconColorHighlight=070603&amp;bgColorError=fee4bd&amp;bgTextureError=04_highlight_hard.png&amp;bgImgOpacityError=65&amp;borderColorError=c26629&amp;fcError=803f1e&amp;iconColorError=ff7519&amp;bgColorOverlay=372806&amp;bgTextureOverlay=13_diamond.png&amp;bgImgOpacityOverlay=20&amp;opacityOverlay=80&amp;bgColorShadow=ddd4b0&amp;bgTextureShadow=01_flat.png&amp;bgImgOpacityShadow=75&amp;opacityShadow=30&amp;thicknessShadow=8px&amp;offsetTopShadow=-8px&amp;offsetLeftShadow=-8px&amp;cornerRadiusShadow=12px">			<img src="themeswitcher/theme_90_swanky_purse.png" alt="Swanky Purse" title="Swanky Purse" />			<span class="themeName">Swanky Purse</span>			</a></li>	</ul></div></div>').find('div').removeAttr('id');
	
	//button events
	button.click(
		function(){
			if(switcherpane.is(':visible')){ switcherpane.spHide(); }
			else{ switcherpane.spShow(); }
					return false;
		}
	);
	
	//menu events (mouseout didn't work...)
	switcherpane.hover(
		function(){},
		function(){if(switcherpane.is(':visible')){$(this).spHide();}}
	);

	//show/hide panel functions
	$.fn.spShow = function(){ $(this).css({top: button.offset().top + options.buttonHeight + 6, left: button.offset().left}).slideDown(50); button.css(button_active); options.onOpen(); }
	$.fn.spHide = function(){ $(this).slideUp(50, function(){options.onClose();}); button.css(button_default); }
	
		
	/* Theme Loading
	---------------------------------------------------------------------*/
	switcherpane.find('a').click(function(){
		updateCSS( $(this).attr('href') );
		var themeName = $(this).find('span').text();
		button.find('.jquery-ui-themeswitcher-title').text( options.buttonPreText + themeName );
		$.cookie(options.cookieName, themeName);
		options.onSelect();
		if(options.closeOnSelect && switcherpane.is(':visible')){ switcherpane.spHide(); }
		return false;
	});
	
	//function to append a new theme stylesheet with the new style changes
	function updateCSS(locStr){
		var cssLink = $('<link href="'+locStr+'" type="text/css" rel="Stylesheet" class="ui-theme" />');
		$("head").append(cssLink);
		
		
		if( $("link.ui-theme").size() > 3){
			$("link.ui-theme:first").remove();
		}	
	}	
	
	/* Inline CSS 
	---------------------------------------------------------------------*/
	var button_default = {
		fontFamily: 'Trebuchet MS, Verdana, sans-serif',
		fontSize: '11px',
		color: '#666',
		background: '#eee url(themeswitcher/buttonbg.png) 50% 50% repeat-x',
		border: '1px solid #ccc',
		'-moz-border-radius': '6px',
		'-webkit-border-radius': '6px',
		textDecoration: 'none',
		padding: '3px 3px 3px 8px',
		width: options.width - 11,//minus must match left and right padding 
		display: 'block',
		height: options.buttonHeight,
		outline: '0'
	};
	var button_hover = {
		'borderColor':'#bbb',
		'background': '#f0f0f0',
		cursor: 'pointer',
		color: '#444'
	};
	var button_active = {
		color: '#aaa',
		background: '#000',
		border: '1px solid #ccc',
		borderBottom: 0,
		'-moz-border-radius-bottomleft': 0,
		'-webkit-border-bottom-left-radius': 0,
		'-moz-border-radius-bottomright': 0,
		'-webkit-border-bottom-right-radius': 0,
		outline: '0'
	};
	
	
	
	//button css
	button.css(button_default)
	.hover(
		function(){ 
			$(this).css(button_hover); 
		},
		function(){ 
		 if( !switcherpane.is(':animated') && switcherpane.is(':hidden') ){	$(this).css(button_default);  }
		}	
	)
	.find('.jquery-ui-themeswitcher-icon').css({
		float: 'right',
		width: '16px',
		height: '16px',
		background: 'url(themeswitcher/icon_color_arrow.gif) 50% 50% no-repeat'
	});	
	//pane css
	switcherpane.css({
		position: 'absolute',
		float: 'left',
		fontFamily: 'Trebuchet MS, Verdana, sans-serif',
		fontSize: '12px',
		background: '#000',
		color: '#fff',
		padding: '8px 3px 3px',
		border: '1px solid #ccc',
		'-moz-border-radius-bottomleft': '6px',
		'-webkit-border-bottom-left-radius': '6px',
		'-moz-border-radius-bottomright': '6px',
		'-webkit-border-bottom-right-radius': '6px',
		borderTop: 0,
		zIndex: 999999,
		width: options.width-6//minus must match left and right padding
	})
	.find('ul').css({
		listStyle: 'none',
		margin: '0',
		padding: '0',
		overflow: 'auto',
		height: options.height
	}).end()
	.find('li').hover(
		function(){ 
			$(this).css({
				'borderColor':'#555',
				'background': 'url(themeswitcher/menuhoverbg.png) 50% 50% repeat-x',
				cursor: 'pointer'
			}); 
		},
		function(){ 
			$(this).css({
				'borderColor':'#111',
				'background': '#000',
				cursor: 'auto'
			}); 
		}
	).css({
		width: options.width-30,
		height: '',
		padding: '2px',
		margin: '1px',
		border: '1px solid #111',
		'-moz-border-radius': '4px',
		clear: 'left',
		float: 'left'
	}).end()
	.find('a').css({
		color: '#aaa',
		textDecoration: 'none',
		float: 'left',
		width: '100%',
		outline: '0'
	}).end()
	.find('img').css({
		float: 'left',
		border: '1px solid #333',
		margin: '0 2px'
	}).end()
	.find('.themeName').css({
		float: 'left',
		margin: '3px 0'
	}).end();
	


	$(this).append(button);
	$('body').append(switcherpane);
	switcherpane.hide();
	if( $.cookie(options.cookieName) || options.loadTheme ){
		var themeName = $.cookie(options.cookieName) || options.loadTheme;
		switcherpane.find('a:contains('+ themeName +')').trigger('click');
	}

	return this;
};




/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
