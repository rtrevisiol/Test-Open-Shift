/**
 * Created by ruggerotrevisiol on 30/01/17.
 * Questo componente è solo un concept per ora
 * 
 */
import {MainScope} from  "../js-tools/MainScope";
export class LookupOBJField extends React.Component {
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
    if (obj.action === "add") {
      campo.value = obj.item.value;
    } else if (obj.action === "remove") {
      campo.value = "";
      /*
       var destinazioni = campo.value;
       var index = value.indexOf(obj.item);
       if (index > -1) {
       destinazioni.splice(index, 1);
       }
       campo.anagraficaValues = destinazioni;
       */
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
    var prepopulate = [];
    if (campo.value) {
      var obj = {"id": campo.name, "value": campo.value};
      prepopulate.push(obj);
    }
    if (campo.config && JSON.parse(campo.config)) {
      var hintText = JSON.parse(campo.config).descrizioneElenco;
    } else {
      var hintText = "cerca dall'elenco";
    }
    $el.find("input").tokenInput(campo.array, {
      theme: "facebook",
      propertyToSearch: "value",
      placeholder: campo.label,
      queryParam: "searchValue",
      // hintText: "cerca dall'elenco",
      hintText: hintText,
      tokenValue: "idAnagraficaParametro",
      prePopulate: prepopulate,
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
        return `<li class='myTokenize'><p>${item.value}</p><span class="descr">${item.descrizione}</span></li>`;
      },
      tokenFormatter: function (item) {
        return `<li class='myTokenize'><p title="${item.descrizione}">${item.value}</p></li>`;
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