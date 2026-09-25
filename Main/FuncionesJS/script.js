// Función para formatear el número de teléfono

document.addEventListener("DOMContentLoaded", function () {

    const telefono = document.getElementById("telefono");

    telefono.addEventListener("input", function () {

        let numero = this.value.replace(/\D/g, "");

        if (numero.length > 10) {
            numero = numero.substring(0, 10);
        }

        if (numero.length <= 3) {
            this.value = numero;
        } 
        else if (numero.length <= 6) {
            this.value = "(" + numero.substring(0, 3) + ") " + numero.substring(3);
        } 
        else {
            this.value = "(" + numero.substring(0, 3) + ") " +
                         numero.substring(3, 6) + "-" +
                         numero.substring(6);
        }
    });

});

//Funcion para formatear el numero de cedula


document.addEventListener("DOMContentLoaded", function () {

    const cedula = document.getElementById("cedula");

    if (!cedula) {
        console.log("No se encontró el campo cedula");
        return;
    }

    cedula.addEventListener("input", function () {

        let numero = this.value.replace(/[^0-9]/g, "");

        numero = numero.substring(0, 11);

        if (numero.length <= 3) {
            this.value = numero;
        } 
        else if (numero.length <= 10) {
            this.value = numero.substring(0, 3) + "-" + numero.substring(3);
        } 
        else {
            this.value = numero.substring(0, 3) + "-" +
                         numero.substring(3, 10) + "-" +
                         numero.substring(10);
        }

    });

});