/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {Functions} from "../js-tools/Functions";
export class ComboboxField extends React.Component {

  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.change = this.change.bind(this);
    this.state = {
      campo: this.props.campo,
      options: []
    }
  }

  componentDidMount() {
    var self = this;
    var campo = this.props.campo;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    $(nodo).on("setField", function () {
      return self.change()
    });
    var $el = $(nodo).closest(".form-group");
    var select = $el.find("select");
    /* */
    var config = this.props.campo.config;
    if (config) {
      var configuration = JSON.parse(config);
    }
    if (configuration && configuration.functions && configuration.functions.length > 0) {
      configuration.functions.forEach(function (item, index, arr) {
        for (let i in item) {
          select.on("change", function () {
            Functions[i](item[i]);
          });
        }
      });
    }
    /* */

    var url = window.configApp.anagrafica_url_by_id;
    var parametroIdQueryString = '?idParametro=' + campo["id"];
    // if (location.hostname === "localhost") {
      parametroIdQueryString = '_idParametro_' + campo["id"];
    // }
    if (window.Liferay) {
      var authToken = '&p_auth=' + Liferay.authToken;
    } else {
      var authToken = "";
    }
    url = url + parametroIdQueryString + authToken;

    //var options = [];
    $.ajax({
      url: url,
      dataType: "json",
      method: "GET",
      async: false
    }).done(function (response) {
      var state = self.state;
      // state.campo.valuesAngrafica = response;
      state.campo.anagraficaValues = response;
      state.options = response;
      if (!state.campo.value) {
        state.campo.value = state.options[0].val;
      } else {
        state.campo.value = state.campo.value;
      }
      var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
      var select = $el.find("select");
      // select.attr("value",state.campo.value);
      $(select).val(state.campo.value);
      self.setState(state);
      self.change();
    }).fail(function (error) {
      console.error("è andata in errore la chiamata per i valori del combobox", error)
    });
  }

  onBlur() {
    return this.change()
  }

  change() {
    var self = this;
    var campo = this.props.campo;
    var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
    var select = $el.find("select");
    var state = this.state;
    if ($(select).val()) {
      state.campo.value = $(select).val();
    }
    var campo = state.campo;
    self.setState(state);
    MainScope.setField(campo);
  }

  render() {
    var self = this;
    var campo = this.props.campo;
    var tipo = this.props.tipo;
    var options = this.state.options, i, optionsTag = [], info;
    for (i in options) {
      var selection = "";
      if (options[i].val == campo.value) {
        info = options[i].info;
      }
      optionsTag.push(<option value={options[i].val} key={i}>{options[i].info}</option>);
    }
    /* */
    var value = "";
    if (this.state.campo.value) {
      value = this.state.campo.value;
    }
    var renderCode = "";
    if (!this.props.readonly) {
      renderCode = (<span>
        <div id={"id_" + campo.name}>
        </div>
        <select id={campo.father + "-" + campo.name} className="form-control" name={campo.name}
                onChange={this.change}
                disabled={campo.readonly}
                onBlur={this.onBlur.bind(this)}
                value={this.state.campo.value}>
          {optionsTag}
        </select>
      </span>);
    } else {
      renderCode = <span>{info}<input name={campo.name} value={campo.value} id={campo.father + "-" + campo.name} type="hidden"/></span>;
    }
    return renderCode;
  }
}