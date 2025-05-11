function parseUplink(device, payload)
{
    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, device.port)
    
    //Canal 1
    var radiacion = decoded.chn1 * 0.079;
    env.log("Ilum W/m2:", radiacion);
    var ep = device.endpoints.byAddress("1");
    ep.updateGenericSensorStatus(radiacion);

    //Canal 2
    var temperatura = (decoded.chn2 - 400) / 10;
    env.log("Temp C.:", temperatura);
    var ep = device.endpoints.byAddress("2");
    ep.updateTemperatureSensorStatus(temperatura);
    
    //Canal 3
    var humedad = decoded.chn3;
    env.log("Hum %:", humedad);
    var ep = device.endpoints.byAddress("3");
    ep.updateHumiditySensorStatus(humedad);

    //Canal 4
    var velviento = decoded.chn4 * 0.36;
    env.log("Viento km/h:", velviento);
    var ep = device.endpoints.byAddress("4");
    ep.updateGenericSensorStatus(velviento);

    //Canal 5
    var velvientog = decoded.chn5;
    env.log("Viento (g):", velvientog)
    var ep = device.endpoints.byAddress("5");
    ep.updateGenericSensorStatus(velvientog);

    //Canal 6
    var precipitacion = decoded.chn6 * 0.1;
    env.log("Precipitacion (mm):", precipitacion);
    var ep = device.endpoints.byAddress("6");
    ep.updateGenericSensorStatus(precipitacion);

}

function buildDownlink(device, endpoint, command, payload) 
{ 
	// Esta función permite convertir un comando de la plataforma en un
	// payload que pueda enviarse al dispositivo.
	// Más información en https://wiki.cloud.studio/page/200

	// Los parámetros de esta función, son:
	// - device: objeto representando el dispositivo al cual se enviará el comando.
	// - endpoint: objeto endpoint representando el endpoint al que se enviará el 
	//   comando. Puede ser null si el comando se envía al dispositivo, y no a 
	//   un endpoint individual dentro del dispositivo.
	// - command: objeto que contiene el comando que se debe enviar. Más
	//   información en https://wiki.cloud.studio/page/1195.

	// Este ejemplo está escrito asumiendo un dispositivo que contiene un único 
	// endpoint, de tipo appliance, que se puede encender, apagar y alternar. 
	// Se asume que se debe enviar un solo byte en el payload, que indica el tipo 
	// de operación.

/*
	 payload.port = 25; 	 	 // Este dispositivo recibe comandos en el puerto LoRaWAN 25 
	 payload.buildResult = downlinkBuildResult.ok; 

	 switch (command.type) { 
	 	 case commandType.onOff: 
	 	 	 switch (command.onOff.type) { 
	 	 	 	 case onOffCommandType.turnOn: 
	 	 	 	 	 payload.setAsBytes([30]); 	 	 // El comando 30 indica "encender" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.turnOff: 
	 	 	 	 	 payload.setAsBytes([31]); 	 	 // El comando 31 indica "apagar" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.toggle: 
	 	 	 	 	 payload.setAsBytes([32]); 	 	 // El comando 32 indica "alternar" 
	 	 	 	 	 break; 
	 	 	 	 default: 
	 	 	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 	 	 break; 
	 	 	 } 
	 	 	 break; 
	 	 default: 
	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 break; 
	 }
*/

}

//https://github.com/Milesight-IoT/SensorDecoders/blob/main/UC_Series/UC500/UC500_TTN.js

function Decoder(bytes, port) {
    var decoded = {};

    for (i = 0; i < bytes.length;) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // BATTERY
        if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        }
        // GPIO1
        else if (channel_id === 0x03 && channel_type !== 0xC8) {
            decoded.gpio1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // GPIO2
        else if (channel_id === 0x04 && channel_type !== 0xC8) {
            decoded.gpio2 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // PULSE COUNTER 1
        else if (channel_id === 0x03 && channel_type === 0xc8) {
            decoded.counter1 = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // PULSE COUNTER 2
        else if (channel_id === 0x04 && channel_type === 0xc8) {
            decoded.counter2 = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // ADC 1
        //For UC50x V2 with firmware version 1.10 and below and UC50x V1, change 1000 to 100.
        else if (channel_id === 0x05) {
            decoded.adc1 = {};
            decoded.adc1.cur = readInt16LE(bytes.slice(i, i + 2)) / 1000;
            decoded.adc1.min = readInt16LE(bytes.slice(i + 2, i + 4)) / 1000;
            decoded.adc1.max = readInt16LE(bytes.slice(i + 4, i + 6)) / 1000;
            decoded.adc1.avg = readInt16LE(bytes.slice(i + 6, i + 8)) / 1000;
            i += 8;
            continue;
        }
        // ADC 2
        //For UC50x V2 with firmware version 1.10 and below and UC50x V1, change 1000 to 100.
        else if (channel_id === 0x06) {
            decoded.adc2 = {};
            decoded.adc2.cur = readInt16LE(bytes.slice(i, i + 2)) / 1000;
            decoded.adc2.min = readInt16LE(bytes.slice(i + 2, i + 4)) / 1000;
            decoded.adc2.max = readInt16LE(bytes.slice(i + 4, i + 6)) / 1000;
            decoded.adc2.avg = readInt16LE(bytes.slice(i + 6, i + 8)) / 1000;
            i += 8;
            continue;
        }
        // MODBUS
        else if (channel_id === 0xFF && channel_type === 0x0E) {
            var modbus_chn_id = bytes[i++] - 6;
            var package_type = bytes[i++];
            var data_type = package_type & 7;
            var date_length = package_type >> 3;
            var chn = 'chn' + modbus_chn_id;
            switch (data_type) {
                case 0:
                    decoded[chn] = bytes[i] ? "on" : "off";
                    i += 1;
                    break;
                case 1:
                    decoded[chn] = bytes[i];
                    i += 1;
                    break;
                case 2:
                case 3:
                    decoded[chn] = readUInt16LE(bytes.slice(i, i + 2));
                    i += 2;
                    break;
                case 4:
                case 6:
                    decoded[chn] = readUInt32LE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
                case 5:
                case 7:
                    decoded[chn] = readFloatLE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
            }
        }
        // MODBUS READ ERROR
        else if (channel_id === 0xff && channel_type === 0x15) {
            var modbus_chn_id = bytes[i] + 1;
            var channel_name = "channel_" + modbus_chn_id + "_error";
            decoded[channel_name] = true;
            i += 1;
        }
        else {
            break;
        }
    }

    return decoded;
}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt8LE(bytes) {
    return (bytes & 0xFF);
}

function readInt8LE(bytes) {
    var ref = readUInt8LE(bytes);
    return (ref > 0x7F) ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return (value & 0xFFFF);
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return (ref > 0x7FFF) ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xFFFFFFFF);
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
}

function readFloatLE(bytes) {
    // JavaScript bitwise operators yield a 32 bits integer, not a float.
    // Assume LSB (least significant byte first).
    var bits = bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
    var sign = (bits >>> 31 === 0) ? 1.0 : -1.0;
    var e = bits >>> 23 & 0xff;
    var m = (e === 0) ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);
    return f;
}