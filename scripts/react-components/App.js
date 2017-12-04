/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {Router, Route, Link, IndexRedirect, hashHistory} from 'react-router';
import {Page} from "./Page";
import {MainScope} from  "../js-tools/MainScope";
export class App extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.scope = {};
    this.state = {campo: this.props.campo};
  }
  componentDidMount() {
    MainScope.set("contraenteLabels", this.props.pagine[2].sourceData.componentData);
  }
  render() {
    var self = this;
    var routes = [], i;
    var className = self.props.classContainer;
    MainScope.set('pagine', this.props.pagine);
    for (i in this.props.pagine) {
      var defaultValue = this.props.pagine[i].default;
      if (defaultValue) {
        self.scope.paginaDefault = this.props.pagine[i].id;
        var defaultRoute = <Route path='/'>
          <IndexRedirect to={"/step/" + this.props.pagine[i].id}/>
        </Route>;
      }
    }
    return <div className={"mainCont " + className}>
      <Router history={hashHistory}>
        {defaultRoute}
        <Route path="/step/:idStep" component={Page}
               pagine={this.props.pagine}/>
        <Route path="/step/:idStep/:esito" component={Page}
               pagine={this.props.pagine}/>
        <Route path="/step/:idStep/:esito/:codiceEsito" component={Page}
               pagine={this.props.pagine}/>
      </Router>
    </div>
  }
}