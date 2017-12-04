/**
 * Created by ruggerotrevisiol on 20/03/17.
 */
/*
 Questo service raccoglie tutti i metodi utili alla validazione
 */
import {MainScope} from  "./MainScope";
import {CodiceFiscale} from "./CodiceFiscale";
class ValidationServiceC{
  constructor(props){
    this.props = props;
    this.creaRegola = this.creaRegola.bind(this);
  }
  creaRegola(campo) {
    var self = this;
    if (campo.visible) {
      try {
        var pagina = MainScope.get("currentPage");
        if (Object.keys($("." + pagina.submitForm).validate().settings.rules).length == 0) {
          $("." + pagina.submitForm).validate();
          $("." + pagina.submitForm).validate().settings.onfocusout = function (element) {
            $(element).valid();
          };
          $("." + pagina.submitForm).validate().settings.highlight = function (element, required) {
            $(element).parent().addClass("has-error");
          }
          $("." + pagina.submitForm).validate().settings.unhighlight = function (element, errorClass, validClass) {
            $(element).parent().removeClass("has-error");
          }
          $("." + pagina.submitForm).validate().settings.errorElement = 'span';
          $("." + pagina.submitForm).validate().settings.errorClass = 'control-label';
          $.validator.addMethod("codfiscale", function (value) {
            // espressione migliorabile... ma sufficiente ^_^
            var regex = /[A-Z]{6}[\d]{2}[A-Z][\d]{2}[A-Z][\d]{3}[A-Z]/;
            var realValue = value.toUpperCase()
            return realValue.match(regex);
          }, "Inserire un codice fiscale valido");
          $.validator.addMethod("unique", function (value, element) {
            var parentForm = $(element).closest('form');
            var timeRepeated = 0;
            if (value != '') {
              $(parentForm.find(':text')).each(function () {
                if ($(this).val() === value) {
                  timeRepeated++;
                }
              });
            }
            return timeRepeated === 1 || timeRepeated === 0;
          }, "* Duplicato");
          /*
           $.validator.addMethod("verificaCodfiscaleReale", function (value) {
           
           // var regex = /[A-Z]{6}[\d]{2}[A-Z][\d]{2}[A-Z][\d]{3}[A-Z]/;
           // return value.match(regex);
           
           // var sesso=form.sesso[0].checked?'M':'F'
           var sesso = $("form *[name=sesso]").val() || "";
           // var data=form.data.value
           var data = $("form *[name=dataNascita]").val() || "";
           data = data.match(/^\s*(\d+).(\d+).(\d+)/) || []
           var codice = CodiceFiscale.calcola_codice(
           $("form *[name=nome]").val() || "",
           $("form *[name=cognome]").val() || "",
           sesso,
           data[1], data[2], data[3],
           $("form *[name=luogoNascita]").val() || ""
           );
           console.info("ecco il codice fiscale", codice);
           var codiceValido = false;
           if (codice.slice(0, -1).toLowerCase() == ($("form *[name=codiceFiscale]").val().slice(0, -1)).toLowerCase()) {
           codiceValido = true;
           }
           return codiceValido;
           }, "Inserire un codice fiscale reale");
           */
          $.validator.addMethod("comboBox", function (value) {
            var regex = /-1/g;
            return !(value.match(regex));
          }, "Inserire un codice fiscale valido");
          // 
          $.validator.addMethod("realMail", function (value) {
            var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;
            return (value.match(regex));
          }, "Inserire una mail corretta!");
          // $("*[id^=oggettiAssicurati][id$=-codiceFiscale]")
          // $(document.getElementsByName("assicurato_codiceFiscale")[0]).rules("add", {
          $("*[id^=oggettiAssicurati][id$=-codiceFiscale]").rules("add", {
            codfiscale: true,
            unique: true,
            messages: {
              codfiscale: "Inserire un codice fiscale valido"
            }
          });
          /* Commentato perchè ora il campo viene prepopolato e quindi è inutile mettere la validazione - Rug
           $(document.getElementsByName("codiceFiscale")[0]).rules("add", {
           verificaCodfiscaleReale: true,
           codfiscale:true,
           messages: {
           codfiscale: "Inserire un codice fiscale valido",
           verificaCodfiscaleReale: "Inserire un codice Fiscale Reale"
           }
           });
           *
           
           $(document.getElementsByName("email")[0]).rules("add", {
           email: true,
           minlength: 3,
           required: true,
           messages: {
           email: "Inserire una email valida"
           }
           });
           */
          // Commentato perchè ora il campo viene prepopolato e quindi è inutile mettere la validazione - Rug
          $(document.getElementsByName("assicurato_email")).rules("add", {
            realMail: true,
            messages: {
              email: "Inserire una email valida"
            }
          });
          $(document.getElementsByName("email")).rules("add", {
            realMail: true,
            messages: {
              email: "Inserire una email valida"
            }
          });
          /* */
        }
        var combo = false;
        if (campo.type == "comboBox" || campo.type == "comboBoxCustom") {
          combo = true;
        }

        $(document.getElementsByName(campo.name)[0]).rules("add", {
          required: campo.required,
          comboBox: combo,
          messages: {
            required: "Campo obbligatorio",
            comboBox: "Selezionare una opzione"
          }
        });
        /*
        $(document.getElementsByName("email")[0]).rules("add", {
          email: true,
          minlength: 3,
          required: true,
          messages: {
            email: "Inserire una email valida"
          }
        });
        */
      } catch (err) {
        console.error("campo", campo);
      }
    }
  }
}
export const ValidationServices = new ValidationServiceC();