/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {Loader} from "./Loader";
export class FooterFlow extends React.Component {
  constructor(props) {
    super(props);
    var testo = "caricamento in corso";
    var tipo = "loader";
    this.submit = this.submit.bind(this);
    this.errorManagement = this.errorManagement.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.cancel = this.cancel.bind(this);
    this.naviga = this.naviga.bind(this);
    this.state = {
      pagina: props.pagina,
      type: tipo,
      warning: testo,
      error: []
    }
  }

  errorManagement(responce) {
    var self = this, state = self.state;
    state.warning = MainScope.getWarningText(responce);
    state.error = MainScope.getErrorText(responce);
    if (state.warning.length > 0 && !(responce.nascondiOverlay)) {
      state.type = "warning";
    } else {
      $(".myLoader").hide();
      // state = self.getInitialState();
    }
    self.setState(state);
  }

  componentDidMount() {
  }

  cancel() {
    var self = this;
    var pagina = this.state.pagina;
    MainScope.naviga({"idPagina": parseInt(pagina.cancelAction)});
  }

  naviga() {
    var self = this;
    var pagina = this.state.pagina;
    MainScope.naviga({"idPagina": parseInt(pagina.submitAction)});
  }

  submit() {
    var pagina = this.state.pagina;
    var valid = true;
    if (pagina.submitForm && $("form." + pagina.submitForm).length > 0) {
      valid = $("." + pagina.submitForm).valid();
    }
    if (valid) {
      var self = this;
      var testo = "caricamento in corso";
      var tipo = "loader";
      var state = {
        type: tipo,
        warning: testo,
        error: []
      }
      self.setState(state);
      var pagina = this.state.pagina;
      var url = window.configApp[pagina.submitAction];
      var datiPolizza = MainScope.getPolizza();
      var data = {"datiPolizza": JSON.stringify(datiPolizza)};
      $(".myLoader").show();
      var method = "POST";
      //if (location.hostname === "localhost") {
        method = "GET";
      //}
      $.ajax({
        url: url,
        data: data,
        dataType: "json",
        method: method,
        success: function (response) {
          var err = !(MainScope.isError(response)).passed;
          if (err) {
            self.errorManagement(response);
          } else {
            var i;
            for (i in response) {
              var prop = response[i];
              if (prop) {
                MainScope.setPolizza(i, prop, true);
              }
            }
            var step = self.props.pagina.id;
            var nextStep = parseInt(step) + 1;
            MainScope.naviga({"idPagina": nextStep, "params": response});
          }
        },
        error: function (error) {
          self.errorManagement(error);
          /*
           var state = self.state;
           state.warning = MainScope.getWarningText(response);
           state.error = MainScope.getErrorText(response);
           self.setState(state);
           
           $(".myLoader").hide();
           console.error("ci sono errori");
           */
        }
      });
    }
  }

  render() {
    var self = this, messaggi = this.state.error;
    var submit = "", cancel = "";
    var pagina = this.props.pagina;
    if (typeof (this.props.submit) == "function") {
      submit = (<div className="btn btn-primary right" onClick={this.props.submit}>
        {pagina.submitLabel}
      </div>);
    }
    if (typeof (pagina.submitAction) == "string" && pagina.submitAction.length > 0) {
      submit = (<div className="btn btn-primary right" onClick={this.submit}>
        {pagina.submitLabel}
      </div>);
    }
    if (typeof (pagina.submitAction) == "number" && pagina.submitAction > 0) {
      cancel = (<div className="btn btn-primary right" onClick={this.naviga}>
        {pagina.submitLabel}
      </div>);
    }
    if (typeof (pagina.cancelAction) == "number" && pagina.cancelAction > 0) {
      cancel = (<div className="btn btn-annulla left" onClick={this.cancel}>
        {pagina.cancelLabel}
      </div>);
    }
    if (typeof (this.props.cancel) == "function") {
      cancel = (<div className="btn btn-annulla left" onClick={this.props.cancel}>
        {pagina.cancelLabel}
      </div>);
    }
    return (<div className="row">
      <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">{this.state.error}</div>
      <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
        {submit} {cancel}
      </div>
      <Loader type={this.state.type} testo={this.state.warning}/>
    </div>);
  }
}