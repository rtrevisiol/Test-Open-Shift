/**
 * Created by ruggerotrevisiol on 02/03/17.
 
 */
import {MainScope} from  "../js-tools/MainScope";
export class CheckboxField extends React.Component {
  // autobind: false,
  constructor(props) {
    super(props);
    this.props = props;
    this.onBlur = this.onBlur.bind(this);
    this.change = this.change.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {campo: this.props.campo};
  }
  componentDidMount() {
    var campo = this.props.campo;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    var $el = $(nodo).closest(".form-group");
    var input = $el.find("input");
  }
  onBlur() {
    return this.change()
  }
  change() {
    var self = this;
    var campo = this.props.campo;
    var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
    var input = $el.find("input");

    var state = this.state;
    state.campo.value = $(input)[0].checked;
    var campo = state.campo;
    self.setState(state);
    MainScope.setField(campo);
  }
  render() {
    var self = this;
    var campo = this.props.campo;
    return (<span>
      <input type="checkbox" id={campo.father + "-" + campo.name} className="" name={campo.name}
             onChange={this.change}
             onBlur={this.onBlur.bind(this)}
             value={campo.value}
             autoComplete="off"
             placeholder=""/>
    </span>);
  }
}
