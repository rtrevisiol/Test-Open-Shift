/**
 * Created by ruggerotrevisiol on 15/02/17.
 */
/*
 Questo modulo che ho creato serve ad avere uno scope comune a tutti i componenti, è dotato di un getter e di un setter che danno la possibilità di accedere alle funzionalità CRUD di  "bigScope" , l'oggetto polizza contiene il polizza Bean "adattato", questo contiene la copia speculare di quello che c'è in sessione su liferay - Rug
 */
import {hashHistory} from 'react-router';
class MainScopeC {
  constructor() {
    /* */
    this.polizza = {
      "parametri": [],
      "contraente": {},
      "oggettiAssicurati": [],
      "prodottoAttivo": {},
      "prodottoSelected": null,
      "consensi": [],
      "survey": null
    };
    this.bigScope = {};
    /* */
    /* */
    this.naviga = this.naviga.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.isError = this.isError.bind(this);
    this.setField = this.setField.bind(this);
    this.getPolizza = this.getPolizza.bind(this);
    this.getErrorText = this.getErrorText.bind(this);
    this.closeLoader = this.closeLoader.bind(this);
    this.getWarningText = this.getWarningText.bind(this);
    this.setPolizza = this.setPolizza.bind(this);
    this.trovaFieldSet = this.trovaFieldSet.bind(this);
    this.trovaField = this.trovaField.bind(this);
    this.setFieldContraente = this.setFieldContraente.bind(this);
    /*  */
  }

  naviga(obj) {
    $(".myLoader").show();
    if (obj.idPagina) {
      this.set('pagina' + obj.idPagina, obj.params);
      hashHistory.push('/step/' + obj.idPagina);
    }
    $(".myLoader").hide();
  }

  get(key) {
    return this.bigScope[key]
  }

  set(key, value) {
    this.bigScope[key] = value;
    return true;
  }

  isError(response) {
    var errori = response.errors;
    var result = {
      passed: true,
      response: response
    }
    if (errori && errori.length > 0) {
      result.passed = false;
    } else {
      result.passed = true;
    }
    return result;
  }
  trovaFieldSet(campo) {
    var fieldSet, self = this;
    var arrFieldSet = self.get("contraenteLabels").fieldSet;
    for (let i in arrFieldSet) {
      var campi = arrFieldSet[i].campi;
      for (let n in campi) {
        if (campi[n].name == campo.name) {
          fieldSet = arrFieldSet[i].name;
        }
      }
    }
    return fieldSet;
  }
  trovaField(campo) {
    var campoNew = {}, self = this;
    var arrFieldSet = self.get("contraenteLabels").fieldSet;
    for (let i in arrFieldSet) {
      var campi = arrFieldSet[i].campi;
      for (let n in campi) {
        if (campi[n].name == campo.name) {
          campoNew = campi[n];
        }
      }
    }
    return campoNew;
  }
  setFieldContraente(name, value) {
    var self = this;
    var campo = {
      name: name
    };
    campo = self.trovaField(campo);
    campo.father = "contraente";
    campo.value = value;
    self.setField(campo);
  }
  /*
   getContraenteField(name) {
   var fieldSet = MainScope.get("contraenteLabels").fieldSet;
   var father = "contraente";
   for (let i in fieldSet) {
   var gruppo = fieldSet[i];
   for (let n in gruppo) {
   var campi = gruppo.campi;
   for (let m in campi) {
   if (name === campi[m].name) {
   return campi[m];
   }
   }
   }
   }
   }
   */
  setField(campo) {
    console.log("cambio in corso", "campo.name ==>", campo.name, "campo.value ==>", campo.value);
    var self = this;
    var father;
    if (campo.father) {
      father = (campo.father).split("[")[0];
    }
    var campi = self.getPolizza(father), i, i2;
    switch (father) {
      case "parametri":
        var salvato = false;
        for (i in campi) {
          if (campi[i].name == campo.name) {
            campi[i] = campo;
            salvato = true;
          }
        }
        if (!salvato) {
          campi.push(campo);
          salvato = true;
        }
        break;
      case "contraente":
        /*  */
        var campiContraente = self.get("contraenteLabels"), i, i3;
        if (!campo.fieldSet) {
          campo.fieldSet = self.trovaFieldSet(campo);
        }
        for (i in campiContraente.fieldSet) {
          if (campiContraente.fieldSet[i].name == campo.fieldSet) {
            var campiVeri = campiContraente.fieldSet[i].campi;
            for (i3 in campiVeri) {
              if (campiVeri[i3].name == campo.name) {
                campo.readonly = campiVeri[i3].readonly;
                campiVeri[i3] = campo;
                salvato = true;
              }
            }
            campiContraente.fieldSet[i].campi = campiVeri;
          }
        }
        self.set("contraenteLabels", campiContraente);
        /*  */
        campi[campo.name] = campo.value;
        salvato = true;
        break;
      case "oggettiAssicurati":
        var index = parseInt((campo.father).split("[")[1].split("]")[0]);
        var parametri = campi[index].parametri;
        for (i2 in parametri) {
          if (parametri[i2].name == campo.name) {
            parametri[i2] = campo;
            salvato = true;
          }
        }
        campi[index].parametri = parametri;
        salvato = true;
        break;
    }
    self.setPolizza(father, campi);
  }

  getPolizza(key) {
    var result;
    if (key) {
      result = this.polizza[key]
    } else {
      result = this.polizza
    }
    return result;
  }

  getErrorText(error) {
    var html = [], i, n;
    // messaggi
    for (i in error.errors) {
      var errore = error.errors[i];
      html.push(<div key={"err" + i} className="errore">{errore}</div>);
    }
    return html;
  }

  closeLoader() {
    $(".myLoader").hide();
  }

  getWarningText(error) {
    var html = [], i, n;
    for (n in error.warning) {
      var warning = error.warning[n];
      html.push(<p key={"warn" + n} className="warning">{warning}</p>);
      if (n == (error.warning.length - 1)) {
        html.push(<div>
          <div key={"warn_chiudi" + n} className="btn btn-primary" onClick={this.closeLoader}>CHIUDI</div>
        </div>);
      }
    }
    return html;
  }

  setPolizza(key, value, http) {
    var self = this;
    if (key && value) {
      if (key == "parametri" || key == "contraente") {
        var i;
        var newContraente = [];
        for (i in value) {
          if (key == "contraente") {
            var thisVal = value[i];
            var campo = {
              "name": i,
            }; //
            if (self.trovaField(campo)) {
              campo = self.trovaField(campo);
            }
            campo.father = "contraente";
            campo.value = thisVal;
            if (http) {
              console.info("aggiorniamo dal web", campo.name, campo.value);
              self.setField(campo);
            }
            newContraente.push(campo);
          } else {
          }
        }
        if (key == "contraente") {
          if (typeof (value[0]) == "string") {
            value = newContraente;
          }
        }
      }
      if (!(key.indexOf("[") > 0)) {
        this.polizza[key] = value;
      } else {
        var index = parseInt((key).split("[")[1].split("]")[0]);
        var realKey = (key).split("[")[0];
        this.polizza[realKey][index] = value;
      }
    } else {
      console.error("immettere tutti i valori per il set dei dati polizza");
    }
    return true;
  }
}
export const MainScope = new MainScopeC();