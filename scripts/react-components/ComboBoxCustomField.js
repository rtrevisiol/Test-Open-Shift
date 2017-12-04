/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";

export class ComboBoxCustomField extends React.Component {

  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.change = this.change.bind(this);
    this.state = {
      campo: this.props.campo,
      infoValue: "",
      options: []
    }
  }

  componentDidMount() {
    var self = this;
    var campo = this.props.campo;
    var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
    var select = $el.find("select");
    var url = window.configApp.getComboBoxAnagraficaUrl;
    var parametroIdQueryString = '&comboBox=' + campo.comboBox;
    
    // if (location.hostname === "localhost") {
      parametroIdQueryString = '_comboBox_' + campo.comboBox;
    // }
    if (window.Liferay) {
      var authToken = '&p_auth=' + Liferay.authToken;
    } else {
      var authToken = "";
    }
    url = url + parametroIdQueryString + authToken;

    $.ajax({
      url: url,
      dataType: "json",
      method: "GET",
      async: false
    }).done(function (response) {
      var state = self.state, i, selected;
      state.options = response;
      for (i in state.options) {
        if (state.options[i].key == campo.value) {
          if (self.props.campo.readonly) {
            state.infoValue = state.options[i].value;
            selected = state.options[i].value;
          }else{
            selected == campo.value;
          }
        }
      }
      self.setState(state);
      // if (!self.props.campo.readonly) {
        self.change(selected);
      // }
    }).fail(function (error) {
      console.error("è andata in errore la chiamata per i valori del combobox", error)
    });
  }

  onBlur() {
    return this.change()
  }

  change(value) {
    var self = this;
    var campo = this.props.campo;
    var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
    var select = $el.find("select");

    var state = this.state;
    if(!select.val()){
      state.campo.value = value;
    }else{
    state.campo.value = select.val();
    }
    state.infoValue = state.campo.value;
    var campo = state.campo;
    self.setState(state);
    if (!this.props.campo.readonly) {
      console.info(">>>>>>>>>>combo ok in scrittura");
      MainScope.setField(campo);
    } else {
      console.info(">>>>>>>>>>combo ok in sola lettura");
    }
  }

  render() {
    var self = this;
    var campo = this.props.campo;
    var options = this.state.options, i, optionsTag = [];
    var renderCode = <span></span>;
    for (i in options) {
      optionsTag.push(<option value={options[i].key} key={i}>{options[i].value}</option>);
    }
    if (!this.props.readonly) {
      renderCode = (<span>
        <div id={"id_" + campo.name}>
        </div>
        <select id={campo.father + "-" + campo.name} className="form-control" name={campo.name}
                onChange={this.change}
                disabled={campo.readonly}
                onBlur={this.onBlur.bind(this)}
                value={this.props.campo.value}>
          {optionsTag}
        </select>
      </span>)
    } else {
      // renderCode = <span>{this.state.infoValue}<input name={campo.name} value={campo.value} id={campo.father + "-" + campo.name} type="hidden"/></span>;
      renderCode = (<span>{this.props.campo.value}
        <div id={"id_" + campo.name} className="hidden">
        </div>
        <select id={campo.father + "-" + campo.name} className="form-control hidden" name={campo.name}
                onChange={this.change}
                disabled={campo.readonly}
                onBlur={this.onBlur.bind(this)}
                value={this.props.campo.value}>
          {optionsTag}
        </select>
      </span>)
    }
    return renderCode;
  }
}