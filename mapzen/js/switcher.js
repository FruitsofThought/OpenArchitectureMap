/**
 * @name Sidebar
 * @class L.Control.Sidebar
 * @extends L.Control
 * @param {string} id - The id of the sidebar element (without the # character)
 * @param {Object} [options] - Optional options object
 * @param {string} [options.position=left] - Position of the sidebar: 'left' or 'right'
 * @see L.control.sidebar
 */
L.Control.SceneSwitcher = L.Control.extend(/** @lends L.Control.SceneSwitcher.prototype */ {
    includes: L.Mixin.Events,

    _currentStyle: '',
 //   _this: ''; // this is not available during initialize
    
    options: {
        styles: {},
        currentStyle: '',
        addTitle: false,
    },

    initialize: function (id, options) {
      this.options = options;
      this._currentStyle = options.currentStyle;
      var qs = window.location.search;
      if (qs) {
        qs = qs.slice(1);
        if (qs[qs.length - 1] === '/') {
          qs = qs.slice(0, qs.length - 1);
        }
        if (styles[qs]) {
          this._currentStyle = qs;
        }
      }
      this._createSwitcher(this);

    },
    
  switchStyles: function(style, layer) {
    if ((this.options.styles[style]) && (style != this._currentStyle)) {
      this._currentStyle = style;
      document.title = this.options.styles[this._currentStyle].name + ' | The Other Maps Project';
      
      //TODO: Remove the dependency on window
      window.layer.scene.reload(this.options.styles[this._currentStyle].file);
      if (this.options.styles[this._currentStyle].sources != null) {
        keys = Object.keys(this.options.styles[this._currentStyle].sources);
        for (key of keys) {
          source = this.options.styles[this._currentStyle].sources[key];
          window.layer.scene.setDataSource(key, source);
        }
       window.layer.scene.requestRedraw();
      }
      if ((this.options.styles[style].legendfunction != null) && (window[this.options.styles[style].legendfunction] != null)){
        $('#legend').html(window[this.options.styles[style].legendfunction]());
        window.sidebar.enable('legendpane');
      } else {
        $('#legend').html('');
        window.sidebar.disable('legendpane');
      }
    }
  },

  getCurrentStyle: function() {
    return this._currentStyle;
  },


  _createSwitcher: function(){
  if (window.self == window.top) {
    var eventFunction = this.switchStyles;
    var styles = this.options.styles
    var keys = Object.keys(this.options.styles);
    var width = 0;
    var switcher = this;
    var currentStyle = this.getCurrentStyle();
    var switcherEL = document.createElement('div');
    switcherEL.className = "control";
    var stylesUL = document.createElement('ul');
    
    if (this.options.addTitle) {
      var titleLI = document.createElement('li');
      var titleTxt = document.createTextNode('styles');
      titleLI.appendChild(titleTxt);
      titleLI.className = 'title';
      styleUL.appendChild(titleLI);
    
      titleLI.addEventListener('click',function(e){
        titleLI.classList.toggle('active');
        var style = document.querySelectorAll('li.style');
        var len = style.length;
        var i =0;
        for( i =0; i<len; i++){
          style[i].classList.toggle('show');
        }
      });
    }
    var curGroup = '';
    var groupUL = document.createElement('ul'); 
    keys.forEach(function(styleKey,index){
      var styleGroup = styles[styleKey].group;
      if (styleGroup != curGroup) {
        if (groupUL.children.length > 0) {
//          stylesUL.appendChild(groupUL);
          switcherEL.appendChild(groupUL);
          groupUL = document.createElement('ul');
        }
        //var groupLI = document.createElement('li');
        var groupTxt = document.createTextNode(styles[styleKey].group);
        groupUL.appendChild(groupTxt);
        groupUL.className = 'group';
        //groupUL.appendChild(groupLI)
        curGroup = styleGroup;
      }
      var styleLI = document.createElement('li');
      var styleTxt = document.createTextNode(styles[styleKey].name);
      styleLI.appendChild(styleTxt);
      styleLI.className = 'style';
      styleLI.setAttribute("id", styleKey);
      if(styleKey == currentStyle){
        styleLI.classList.add('active');
      }
      styleLI.style.cssText = 'top: ' + ((index+1) * 48) + 'px';
      styleLI.addEventListener('click',function(e){
        switcher.switchStyles(styleKey);
        removeActiveClass();
        styleLI.classList.add('active');
      });
      groupUL.appendChild(styleLI);
      switcherEL.appendChild(groupUL);
    });
//    stylesUL.appendChild(groupUL);
//    switcherEL.appendChild(stylesUL);
    switcherEL.appendChild(groupUL);
    $('#sceneswitcher').append(switcherEL);
  }
/*
 *     params.forEach(function(styleName,index){
      var styleLI = document.createElement('li');
      var styleTxt = document.createTextNode(styleName);
      styleLI.appendChild(styleTxt);
      styleLI.className = 'style';
      if(styleName == cStyle){
        styleLI.classList.add('active');
      }
      styleLI.style.cssText = 'top: ' + ((index+1) * 48) + 'px';
      styleLI.addEventListener('click',function(e){
        func(styleName);
        removeActiveClass();
        styleLI.classList.add('active');
      });
      styleUL.appendChild(styleLI);
    });
    switcherEL.appendChild(styleUL);
    document.body.appendChild(switcherEL);
  }*/
   function removeActiveClass(){
      var style = document.querySelectorAll('li.style');
      var len = style.length;
      var i =0;
      for( i =0; i<len; i++){
          style[i].classList.remove('active');
      }
   }
},


    /**
     * Add this sidebar to the specified map.
     *
     * @param {L.Map} map
     * @returns {Sidebar}
     */
    addTo: function (map) {
        var i, child;

        this._map = map;
      // Add the legend
      if ((this.options.styles[this._currentStyle].legendfunction != null) && (window[this.options.styles[this._currentStyle].legendfunction] != null)){
        $('#legend').html(window[this.options.styles[this._currentStyle].legendfunction]());
        map.sidebarcontrols['sidebar'].enable('legendpane');
      } else {
        $('#legend').html('');
        map.sidebarcontrols['sidebar'].disable('legendpane');
      }

/*        for (i = this._tabitems.length - 1; i >= 0; i--) {
            child = this._tabitems[i];
            L.DomEvent
                .on(child.querySelector('a'), 'click', L.DomEvent.preventDefault )
                .on(child.querySelector('a'), 'click', this._onClick, child);
        }

        for (i = this._closeButtons.length - 1; i >= 0; i--) {
            child = this._closeButtons[i];
            L.DomEvent.on(child, 'click', this._onCloseClick, this);
        }
*/
        return this;
    },


});

/**
 * Creates a new sidebar.
 *
 * @example
 * var sidebar = L.control.sidebar('sidebar').addTo(map);
 *
 * @param {string} id - The id of the sidebar element (without the # character)
 * @param {Object} [options] - Optional options object
 * @param {string} [options.position=left] - Position of the sidebar: 'left' or 'right'
 * @returns {Sidebar} A new sidebar instance
 */
L.control.sceneswitcher = function (id, options) {
    return new L.Control.SceneSwitcher(id, options);
};
