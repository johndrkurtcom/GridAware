var React = require('react');
var cookie = require('react-cookie');

// Material UI
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

// Routing
var Router = require('react-router');
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;

// Dispatcher
var Dispatcher = require('./dispatcher/Dispatcher');

//mui theme
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var RaisedButton = mui.RaisedButton;
var Dialog = mui.Dialog;
var SnackBar = mui.Snackbar;

// Components
var NavMenu = require('./components/NavMenu.jsx');
var LoginView = require('./components/LoginView.jsx');
var ProfileView = require('./components/ProfileView.jsx');
var RegistrationView = require('./components/RegistrationView.jsx');
var engergyBreakDown = require('./components/energyBreakDownView.jsx');
var AboutUs = require('./components/AboutUs.jsx');

// Stores -- Load here so Stores can begin listening to Events
var UserStore = require('./stores/UserStore');
var DataStore = require('./stores/DataStore');
var ModalStore = require('./stores/modalStore');

// Actions
var ViewActions = require('./actions/ViewActions');
var ActionTypes = require('./constants/Constants').ActionTypes;

var App = React.createClass({
  getInitialState: function(){
    return{
      showModal: ModalStore.getModalState().isOpen,
      modal: null,
      logMes: "",
    };

  },
  
  mixins: [Router.Navigation, Router.State],

  getChildContext: function(){
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  modalListener: function(){
    var modalSpecs = ModalStore.getModalState();
    // console.log(modalSpecs);
    this.setState({showModal: modalSpecs.isOpen, modal: modalSpecs.modal});
  },

  componentWillMount: function(){ 
    //Set color palette
    var appPalette = { 
      primary1Color: '#58C1BE',
      primary2Color: '#227889',
      primary3Color: '#94D9BB',
      accent1Color: '#FFDE55',
      accent2Color: '#F6BB42',
      textColor: '#212121',
      canvasColor: '#FFFFFF',
      borderColor: '#B6B6B6'
    };
    ThemeManager.setPalette(appPalette);

    var token = cookie.load('token');
    if(token){
      ViewActions.loginUser({token: token});
    }
  },

  componentDidMount: function() {
    ModalStore.addChangeListener(this.modalListener);
    var context = this;
    this.token = Dispatcher.register(function (dispatch){
      var action = dispatch.action;
      if(action.type === ActionTypes.USER_LOGIN){
        context.showSnack('Logged In');
      }
      if(action.type === ActionTypes.SHOW_SNACK){
        context.showSnack('Logged Out');
      }
    });
  },

  componentWillUnmount: function (){
    ModalStore.removeChangeListener(this.modalListener);
    Dispatcher.unregister(this.token);
  },

  toggleNav: function(){
    ViewActions.toggleNavMenu();
  },

  showSnack: function(message){
    this.setState({logMes: message});
    this.refs.snackbar.show();

  },

  render: function(){
    return (
      <div className="app-container">
      
        <span className="nav-btn">
          <RaisedButton onClick={this.toggleNav}>Menu</RaisedButton>
        </span>
        <NavMenu></NavMenu>
      <div className="content-container">
        <RouteHandler />
      </div>
      <div className="modal-container">
      { this.state.showModal ? 
        <div>
          <this.state.modal openImmediately={true} dialog={true} />
        </div> : null }
      </div>
      <SnackBar
          ref='snackbar'
          message={this.state.logMes}
          autoHideDuration={2000} />
      </div>

    );
  }
});


var routes = (
  <Route name="app" path="/" handler={App}>
  <Route name="profile" path="/profile" handler={ProfileView} />
  <DefaultRoute name="default" handler={AboutUs} />
  </Route>
);

Router.run(routes, function(Root){
  React.render(<Root />, document.getElementById('AppView'));
});