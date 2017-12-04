/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class CurrencyField extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.change = this.change.bind(this);
    this.state = {
      campo: this.props.campo
    }
  }
  componentDidMount() {
    var campo = this.props.campo;
    var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
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
    if (!(isNaN(input.val()))) {
      state.campo.value = input.val();
    }

    var campo = state.campo;
    self.setState(state);
    MainScope.setField(campo);
  }
  render() {
    var self = this;
    var campo = this.props.campo;
    return (<span>
      <input type="text" id={campo.father + "-" + campo.name} className="form-control" name={campo.name}
             onChange={this.change}
             onBlur={this.onBlur.bind(this)}
             autoComplete="off"
             value={campo.value}
             placeholder={campo.label}/>
    </span>);
  }
}