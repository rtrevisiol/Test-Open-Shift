/**
 * Created by ruggerotrevisiol on 27/02/17.
 */
import {DinamicField} from "./DinamicField";
import {Riepilogo} from "./Riepilogo";
import {FooterFlow} from "./FooterFlow";
import {FormDati} from "./FormDati";
import {OggettiAssicurati} from "./OggettiAssicurati";
import {MainScope} from  "../js-tools/MainScope";
import {Questionario} from "./Questionario";
import {ValidationServices} from "../js-tools/ValidationService";
import {CodiceFiscale} from "../js-tools/CodiceFiscale";
/*
import {Codicefiscale} from "../js-tools/CodiceFiscale";
const CodiceFiscale = new Codicefiscale;
*/
export class DatiPersonali extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.precompilaDati = this.precompilaDati.bind(this);
    this.scegliNazione = this.scegliNazione.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.compilaAssicurato = this.compilaAssicurato.bind(this);
    this.cercaProvincia = this.cercaProvincia.bind(this);
    this.state = {
      survey: MainScope.get("surveyView")
    }
  }
  precompilaDati() {
    var state = this.state, self = this;
    var codiceComune = codiceComune = ($("#contraente-codiceFiscale").val()).substring(11, 15);
    if (codiceComune[0] !== "Z") {
      var comune = CodiceFiscale.trova_comune(codiceComune);
      console.log("comune:", comune);
      $("#contraente-luogoNascita").val(comune.split(" (")[0]);
      $("#contraente-luogoNascita").parent().text(comune.split(" (")[0]);
      MainScope.setFieldContraente("luogoNascita", comune.split(" (")[0]);
      // $("#contraente-luogoNascita").trigger("setField");
      var siglaProvincia = comune.substring(comune.lastIndexOf("(") + 1, comune.lastIndexOf(")"));
      var provinceOpts = $("#contraente-provinciaNascita option");
      var sigla = "";
      $("#contraente-provinciaNascita").parent().text(siglaProvincia);

      /* */
      console.log("provinceOpts.length", provinceOpts.length);
      provinceOpts.each(function () {
        var provincia = $(this).text();
        sigla = provincia.substring(provincia.lastIndexOf("(") + 1, provincia.lastIndexOf(")"));
        if (sigla == siglaProvincia) {
          $("#contraente-provinciaNascita").val(this.value);
          MainScope.setFieldContraente("provinciaNascita", this.value);
          // $("#contraente-provinciaNascita").trigger("setField");
        }
      });
      /* */
      console.info("siglaProvincia :", siglaProvincia);
      self.scegliNazione("Italia");
    } else {
      $("#contraente-luogoNascita").parent().text("EE");
      $("#contraente-provinciaNascita").parent().text("EE");
      /* *
       $("#contraente-luogoNascita").val("EE");
       $("#contraente-luogoNascita").trigger("setField");
       $("#contraente-provinciaNascita").val("EE");
       $("#contraente-provinciaNascita").trigger("setField");
       /* */
      self.scegliNazione(CodiceFiscale.trova_comune(codiceComune));
    }
  }
  scegliNazione(nazione) {
    console.log("nazione", nazione);
    var options = $("#contraente-paeseNascita option");
    console.log("options.length", options.length);
    $("#contraente-paeseNascita").parent().text(nazione);
    // $("#contraente-paeseNascita").val(nazione);
    // $("#contraente-paeseNascita").trigger("setField");
    /* */
    options.each(function () {
      if (($(this).text().toLowerCase()).indexOf(nazione.toLowerCase()) > -1) {
        $("#contraente-paeseNascita").val(this.value);
        MainScope.setFieldContraente("paeseNascita", this.value);
        // $("#contraente-paeseNascita").trigger("setField");
      }
    });
    /* */
  }
  componentDidMount() {
    var state = this.state, self = this;
    if (!(state.survey)) {
      $("#Questionario").toggle();
      state.survey = true;
      MainScope.set("surveyView", true);
      self.setState(state);
    }
    /* trova provincia */
    // $("#contraente-citta").parent().parent().parent().on("click", function () {
    $("#contraente-citta").on("change", function () {
      //setInterval(function () {
      var sigla = $($("#contraente-citta").parent()).find("ul>li:eq(0)>p").attr("title");
      console.log("sigla:", sigla)
      if (sigla) {
        /*
         var citta = testo.split(" (")[0];
         console.log("citta:", citta);
         MainScope.setFieldContraente("citta:", citta);
         */
        // $(document.getElementById("contraente-citta")).prop('disabled', true);
        self.cercaProvincia(sigla);
      }
      // }, 300);
      // });
    });
    /* */
    /* precompilazione di valori dal codice fiscale */
    setTimeout(function () {
      self.precompilaDati();
    }, 0);
    /* */
  }
  compilaAssicurato(event) {
    var compilaAss = event.target.checked;
    if (compilaAss) {
      $(document.getElementById("oggettiAssicurati[0]-nome")).val(document.getElementsByName("nome")[0].value);
      $(document.getElementById("oggettiAssicurati[0]-cognome")).val(document.getElementsByName("cognome")[0].value);
      $(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).val(document.getElementsByName("codiceFiscale")[0].value);
      $(document.getElementById("oggettiAssicurati[0]-email")).val(document.getElementsByName("email")[0].value);
    } else {
      $(document.getElementById("oggettiAssicurati[0]-nome")).val("");
      $(document.getElementById("oggettiAssicurati[0]-cognome")).val("");
      $(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).val("");
      $(document.getElementById("oggettiAssicurati[0]-email")).val("");
    }
    $(document.getElementById("oggettiAssicurati[0]-nome")).trigger("setField");
    $(document.getElementById("oggettiAssicurati[0]-cognome")).trigger("setField");
    $(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).trigger("setField");
    $(document.getElementById("oggettiAssicurati[0]-email")).trigger("setField");
  }
  cercaProvincia(siglaProvincia) {
    var provinceOpts = $("#contraente-provincia option");
    var sigla = "";
    /* */
    console.log("provinceOpts.length", provinceOpts.length);
    provinceOpts.each(function () {
      var provincia = $(this).text();
      sigla = provincia.substring(provincia.lastIndexOf("(") + 1, provincia.lastIndexOf(")"));
      if (sigla == siglaProvincia) {
        console.log("#contraente-provincia", this.value);
        $("#contraente-provincia").val(this.value);
        MainScope.setFieldContraente("provincia", this.value);
        $(document.getElementById("contraente-provincia")).prop('disabled', true);
      }
    });
  }
  render() {
    var pagina = this.props.pagina;
    var componentData = this.props.pagina.sourceData.componentData, campi = [], consensi = [], listaOggettiAssicurati = [];
    campi = MainScope.get("contraenteLabels").fieldSet;
    console.log("contraente labels ===>", campi);
    /* */
    var comuni = CodiceFiscale.solo_comuni();
    for (let i in campi[1].campi) {
      if (campi[1].campi[i] && campi[1].campi[i].name == "citta") {
        campi[1].campi[i].array = comuni;
      }
    }
    /* */
    consensi = componentData.consents;
    listaOggettiAssicurati = []
    var polizza = MainScope.getPolizza();
    if (polizza) {
      listaOggettiAssicurati = polizza.oggettiAssicurati
    }
    return (<div className="row preventivo">
      <div className="col-md-6 col-md-push-6">
        <Riepilogo />
      </div>
      <div className="col-md-6 col-md-pull-6">
        <form className={"form-inline " + pagina.submitForm + " col-xs-12 col-sm-12 col-md-12 col-lg-12"}>
          <FormDati father="contraente" campi={campi}/>
          <div className="row">
            <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
              <input type="checkbox" onClick={this.compilaAssicurato}/>
              &nbsp;
              &nbsp;
              il contraente è anche l'assicurato?
            </div>
          </div>
          <OggettiAssicurati assicurati={listaOggettiAssicurati}/>
          <div className="row">
            <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
              <Questionario />
            </div>
          </div>
          <br />
          <FormDati father="consensi" consensi={consensi}/>
        </form>
      </div>
      <FooterFlow pagina={pagina}/>
    </div>);
  }
}