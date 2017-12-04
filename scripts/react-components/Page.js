/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {HeaderStep} from "./HeaderStep";
import {PageComposer} from "./PageComposer";
import {MainScope} from  "../js-tools/MainScope";

export class Page extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.trovaPagina = this.trovaPagina.bind(this);
    this.scope = {pagina: {}};
    this.state = {campo: this.props.campo};
  }
  trovaPagina(idStep) {
    var self = this;
    var pagine = this.props.route.pagine, i = undefined;
    for (i in pagine) {
      if (pagine[i].id == parseInt(idStep)) {
        self.scope.pagina = pagine[i];
      }
    }
  }
  componentDidMount() {
    MainScope.set("currentPage", this.scope.pagina);
  }
  shouldComponentUpdate(propCh, stateCh) {
    this.trovaPagina(propCh.params.idStep);
    MainScope.set("currentPage", this.scope.pagina);
    return true;
  }
  render() {
    var self = this;
    self.trovaPagina(self.props.params.idStep);
    return (<div className="pageReact">
      <div className="row">
        <HeaderStep active={self.props.params.idStep} pagine={self.props.route.pagine}/>
      </div>
      <div className="row">
        <PageComposer parametri={self.props.params} pagina={self.scope.pagina}/>
      </div>
    </div>);
  }
}