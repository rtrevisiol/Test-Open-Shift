/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class LookupField extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.onBlur = this.onBlur.bind(this);
    this.updateField = this.updateField.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {campo: this.props.campo};
  }

  onBlur() {
    return this.updateField()
  }

  updateField(obj) {
    var campo = this.state.campo;
    var self = this;
    if (!campo.anagraficaValues) {
      campo.anagraficaValues = [];
    }
    if (obj.action === "add") {
      campo.anagraficaValues.push(obj.item)
    } else if (obj.action === "remove") {
      var array = campo.anagraficaValues;
      var index = array.indexOf(obj.item);
      if (index > -1) {
        array.splice(index, 1);
      }
      campo.anagraficaValues = array;
    }
    self.setState({"campo": campo});
    MainScope.setField(campo);
  }

  componentDidMount() {
    var self = this;
    var campo = this.props.campo;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    var $el = $(nodo).closest(".form-group");
    $el.addClass("form-group-destinazione");
    var input = $el.find("input");
    var url = window.configApp["anagrafica_url"] + "?";
    var parametroIdQueryString = 'idParametro=' + campo["id"];
    if (window.Liferay) {
      var authToken = '&p_auth=' + Liferay.authToken;
    } else {
      var authToken = "";
    }
    url = url + parametroIdQueryString + authToken;
    if (!campo.anagraficaValues) {
      campo.anagraficaValues = [];
    }
    if (campo.config && JSON.parse(campo.config)) {
      var hintText = JSON.parse(campo.config).descrizioneElenco;
    } else {
      var hintText = "cerca dall'elenco";
    }
    $el.find("input").tokenInput(url, {
      theme: "facebook",
      propertyToSearch: "val",
      queryParam: "searchValue",
      placeholder: campo.label,
      tokenValue: "idAnagraficaParametro",
      prePopulate: campo.anagraficaValues,
      // hintText: "cerca dall'elenco",
      hintText: hintText,
      onAdd: function (item) {
        self.updateField({"id": campo.name, "item": item, "action": "add"});
      },
      onDelete: function (item) {
        self.updateField({"id": campo.name, "item": item, "action": "remove"});
      },
      tokenLimit: 1,
      resultsLimit: 100,
      preventDuplicates: true,
      minChars: 2,
      resultsFormatter: function (item) {
        return `<li class='myTokenize'><p>${item.val} <b style='color: red'>${item.descrizione}</b></p></li>`;
      },
      tokenFormatter: function (item) {
        return `<li class='myTokenize'><p title="${item.descrizione}">${item.val}</p></li>`;
      },
      onReady: function () {
        $("#token-input-" + campo.father + "-" + campo.name).addClass("form-control");
      },
      classes: {
        tokenList: "token-input-list-facebook",
        token: "token-input-token-facebook",
        tokenDelete: "token-input-delete-token-facebook",
        selectedToken: "token-input-selected-token-facebook",
        highlightedToken: "token-input-highlighted-token-facebook",
        dropdown: "token-input-dropdown-facebook",
        dropdownItem: "token-input-dropdown-item-facebook",
        dropdownItem2: "token-input-dropdown-item2-facebook",
        selectedDropdownItem: "token-input-selected-dropdown-item-facebook",
        inputToken: "token-input-input-token-facebook"
      }
    });
  }

  render() {
    var self = this;
    var campo = this.props.campo;
    var classReadonly = "";
    if (campo.readonly) {
      classReadonly = "readonly";
    }
    return (<span className={classReadonly}>
      <div className="content-tags">
        <input onBlur={this.onBlur.bind(this)} type="text" id={campo.father + "-" + campo.name}
               className="form-control" name={campo.name}
               placeholder={campo.label}/>
      </div>
    </span>);
  }
}