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
        this._createSwitcher();

    },
    
  switchStyles: function(style, layer) {
    if (this.options.styles[style]) {
      this._currentStyle = style;
      //TODO: Remove the dependency on window
      window.layer.scene.reload(this.options.styles[this._currentStyle].file);
      //TODO: handle this with inheritance, a hook or a callback
    switch (this._currentStyle) {
      case "startdates":
        startdates_legend();
        break;
      case "architecturalstyles":
        map.setView([-6.1653329612873105, 39.19835239648819, 14]);
        break;
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
          stylesUL.appendChild(groupUL);
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
//      styleLI.setAttribute("id", styleKey);
      if(styleKey == this._currentStyle){
        styleLI.classList.add('active');
      }
      styleLI.style.cssText = 'top: ' + ((index+1) * 48) + 'px';
      styleLI.addEventListener('click',function(e){
        switcher.switchStyles(styleKey);
        removeActiveClass();
        styleLI.classList.add('active');
      });
      groupUL.appendChild(styleLI);
    });
    stylesUL.appendChild(groupUL);
    switcherEL.appendChild(stylesUL);
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
