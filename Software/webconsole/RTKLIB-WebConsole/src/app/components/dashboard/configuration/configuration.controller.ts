/*
 * RTKLIB WEB CONSOLE code is placed under the GPL license.
 * Written by Frederic BECQUIER (frederic.becquier@openiteam.fr)
 * Copyright (c) 2016, DROTEK SAS
 * All rights reserved.

 * If you are interested in using RTKLIB WEB CONSOLE code as a part of a
 * closed source project, please contact DROTEK SAS (contact@drotek.com).

 * This file is part of RTKLIB WEB CONSOLE.

 * RTKLIB WEB CONSOLE is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * RTKLIB WEB CONSOLE is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with RTKLIB WEB CONSOLE. If not, see <http://www.gnu.org/licenses/>.
 */

import angular = require("angular");
import angular_ui_bootstrap = require('angular-ui-bootstrap');
import { IConfigurationService, IParameter, IStreamInfo, IRTKRCVConfig, ISTR2STRConfig } from "../../../shared/services/configuration.service";
import { IAdminService } from "../../../shared/services/admin.service";

import push_conf_controller from '../modals/push-conf/push-conf.controller';
import save_conf_controller from '../modals/save-conf/save-conf.controller';
import open_conf_controller from '../modals/open-conf/open-conf.controller';



export interface IRTKStreamFormats {
    [id: string]: string;
}

const rtkStreamFormats: IRTKStreamFormats = {
    "rtcm2": "RTCM 2 (only in)",
    "rtcm3": "RTCM 3",
    "nov": "NovAtel OEMV/4/6,OEMStar (only in)",
    "oem3": "NovAtel OEM3 (only in)",
    "ubx": "ublox LEA-4T/5T/6T (only in)",
    "ss2": "NovAtel Superstar II (only in)",
    "hemis": "Hemisphere Eclipse/Crescent (only in)",
    "stq": "SkyTraq S1315F (only in)",
    "gw10": "Furuno GW10 (only in)",
    "javad": "Javad (only in)",
    "nvs": "NVS BINR (only in)",
    "binex": "BINEX (only in)",
    "rt17": "Trimble RT17 (only in)",
    "sbf": "Septentrio SBF (only in)",
    "cmr": "CMR/CMR+ (only in)"
};

export interface IRTKStreamTypes {
    [id: string]: { default?: string, example: string, available?: string, };
}

const rtkStreamTypes: IRTKStreamTypes = {

    "serial": {
        default: 'ttyUSB0:57600:8:n:1:off',
        example: "port[:bit_rate[:byte[:parity(n|o|e)[:stopb[:fctr(off|on)]]]]]"
    },
    "file": {
        default: "$RTKLIBLOGDIR/bas_%Y%m%d%h%M.ubx",
        example: ":path[::T[::+offset][::xspeed]]"
    },
    "tcpsvr": {
        default: "2424",
        example: ":port"
    },
    "tcpcli": {
        example: "addr:port"
    },
    "ntripsvr": {
        example: "user:passwd@addr:port/mntpnt[:str]"
    },
    "ntripcli": {
        example: "user:passwd@addr:port/mntpnt"
    },
    "ftp": {
        example: "user:passwd@addr/path[::T=poff,tint,off,rint]"
    },
    "http": {
        example: "addr/path[::T=poff,tint,off,rint]"
    },
};

export interface INavSys {
    name: string;
    value: number;
    selected: boolean;
}



export interface IConfigurationScope extends angular.IScope {
    oneAtATime: boolean;
    status: { isRequiredOpen: boolean; isFirstDisabled: boolean; isBaseCmdOpen: boolean; isInputParametersOpen: boolean; isOutputParametersOpen: boolean; };
    requiredParams: IParameter[];
    advancedParams: IParameter[];
    otherParams: IParameter[];
    cmdParams: IParameter[];
    isRover: boolean;
    rtkrcv_config: IRTKRCVConfig;
    str2str_config: ISTR2STRConfig;
    inputStreams: IStreamInfo[];
    outputStreams: IStreamInfo[];
    streamTypes: IRTKStreamTypes;
    streamFormats: IRTKStreamFormats;
    currentMode: "ROVER" | "BASE";
    listNavSys: INavSys[];
    //navSysParameter: INavSys;
}

export default/*@ngInject*/ function ($scope: IConfigurationScope, configuration: IConfigurationService, $modal: angular_ui_bootstrap.IModalService,
    $rootScope: angular.IRootScopeService, admin: IAdminService) {

    /* Déclaration du logger */
    console.log('dashboard.configuration');

    /* Déclaration des variables utilisées dans le controlleur */
    $scope = angular.extend($scope, {
        oneAtATime: true,
        status: {
            isRequiredOpen: true,
            isFirstDisabled: false,
            isBaseCmdOpen: true,
            isInputParametersOpen: true,
            isOutputParametersOpen: true
        },
        requiredParams: [] as IParameter[],
        advancedParams: [] as IParameter[],
        otherParams: [] as IParameter[],
        cmdParams: [] as IParameter[],
        isRover: false,

        inputStreams: [] as IStreamInfo[],
        outputStreams: [] as IStreamInfo[],

        rtkrcv_config: null,
        str2str_config: null,
        streamTypes: rtkStreamTypes,
        streamFormats: rtkStreamFormats,
        currentMode: null,
        listNavSys: [
            { value: 1, name: 'GPS', selected: false },
            { value: 2, name: 'SBAS', selected: false },
            { value: 8, name: 'GALILEO', selected: false },
            { value: 4, name: 'GLONASS', selected: false },
            { value: 16, name: 'QZSS', selected: false },
            { value: 32, name: 'BEIDOU', selected: false }
        ] as INavSys[]//,
        //navSysParameter: undefined
    } as IConfigurationScope);

    $scope.listNavSys.sort((a: INavSys, b: INavSys) => {
        return a.value - b.value;
    });

    function resize_streams(streams: IStreamInfo[], desired_number: number) {
        console.log("resizing stream from ", streams, "to", desired_number);
        let add_streams = desired_number - streams.length;
        if (add_streams > 0) {
            for (let i = 0; i < add_streams; i++) {
                streams.push({
                    streamType: "serial",
                    streamPath: "",
                    streamFormat: ""
                });
            }
        }

        let remove_streams = streams.length - desired_number;
        if (remove_streams > 0) {
            streams.length = desired_number;
        }
    }

    // inpstr1-type =serial
    // inpstr1-path =ttyACM0:57600:8:n:1:off # rover
    // inpstr1-format =ubx

    function cleanup_value(val: string | number | null): string {
        if (val === null || val == undefined) {
            return "";
        }
        if (typeof val == typeof 0) {
            return val.toString();
        }
        let comment_idx = (val as string).indexOf("#");
        if (comment_idx == -1) {
            return (val as string).trim();
        }
        return (val as string).substr(0, comment_idx).trim();
    }

    function get_iparameter_value(parameters: IParameter[], find_key: string): string {
        let parameter = (parameters) ? parameters.find((p) => p.key == find_key) : null;
        return cleanup_value((parameter) ? parameter.value : null);
    }

    function parse_config_file() {
        //let config_params = $scope.otherParams.filter((p)=>p.key.startsWith("inpstr") || p.key.startsWith("outstr"));
        $scope.inputStreams = [];
        $scope.outputStreams = [];
        for (let i = 1; i < 4; i++) {
            {
                let in_type = get_iparameter_value($scope.otherParams, `inpstr${i}-type`);
                let in_path = get_iparameter_value($scope.otherParams, `inpstr${i}-path`);
                let in_format = get_iparameter_value($scope.otherParams, `inpstr${i}-format`);

                if (in_path) {
                    $scope.inputStreams.push({
                        streamPath: in_path,
                        streamFormat: in_format,
                        streamType: in_type
                    });
                }
            }

            {
                let out_type = get_iparameter_value($scope.otherParams, `outstr${i}-type`);
                let out_path = get_iparameter_value($scope.otherParams, `outstr${i}-path`);
                let out_format = get_iparameter_value($scope.otherParams, `outstr${i}-format`);

                if (out_path) {
                    $scope.inputStreams.push({
                        streamPath: out_path,
                        streamFormat: out_format,
                        streamType: out_type
                    });
                }
            }

        }
    }

    function update_streams(){
        if ($scope.currentMode == "ROVER") {
            //$scope.inputStreams = $scope.rtkrcv_config
            resize_streams($scope.inputStreams, 3);
            resize_streams($scope.outputStreams, 3);
        } else if ($scope.currentMode == "BASE") {
            $scope.inputStreams = ($scope.str2str_config) ? $scope.str2str_config.in_streams : [];
            $scope.outputStreams = ($scope.str2str_config) ?$scope.str2str_config.out_streams : [];
            resize_streams($scope.inputStreams, 1);
            resize_streams($scope.outputStreams, 3);
        } else {
            $scope.currentMode = "BASE";

            $scope.inputStreams = ($scope.str2str_config) ? $scope.str2str_config.in_streams : [];
            $scope.outputStreams = ($scope.str2str_config) ? $scope.str2str_config.out_streams : [];

            console.log("unknown mode, setting stream default", $scope.currentMode);
            resize_streams($scope.inputStreams, 1);
            resize_streams($scope.outputStreams, 3);
        }
    }

    $scope.$watch(() => { return $scope.currentMode; }, () => {
        console.log("currentMode", $scope.currentMode);
        update_streams();
    });





    /* Watch Expressions */
    // $scope.$watch(() => {
    //     return admin.getActiveMode();
    // }, (newVal) => {
    //     if (typeof newVal !== 'undefined') {
    //         $scope.currentMode = newVal;
    //         configuration.setMode(newVal);
    //         checkMode(newVal);
    //     }
    // });

    // $scope.$watch(() => {
    //     return configuration.getMode();
    // }, (newVal) => {
    //     if (typeof newVal !== 'undefined') {
    //         $scope.currentMode = newVal;
    //         checkMode(newVal);
    //     }
    // });

    configuration.getRTKRCVConfig().then((val) => {
        $scope.rtkrcv_config = val;
        update_streams();
        console.log("loaded rtkrcv config", val)
    });

    configuration.getSTR2STRConfig().then((val) => {
        $scope.str2str_config = val;
        update_streams();
        console.log("loaded str2str config", val);
    });

    $scope.$watch(() => {
        return configuration.getOutputType();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.selectedOutputType = newVal;
        }
    });

    $scope.$watch(() => {
        return configuration.getOutputValue();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.outputPath = newVal;
        }
    });

    $scope.$watch(() => {
        return configuration.getRequiredParams();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.requiredParams = newVal;
        }
    });

    $scope.$watch(() => {
        return configuration.getAdvancedParams();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.advancedParams = newVal;
        }
    });

    $scope.$watch(() => {
        return configuration.getOtherParams();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.otherParams = newVal;
        }
    });

    $scope.$watch(() => {
        return configuration.getCmdParams();
    }, (newVal) => {
        if (typeof newVal !== 'undefined') {
            $scope.cmdParams = newVal;
        }
    });

    $scope.inputPorts = [];
    admin.listPorts().then((ports) => {
        $scope.inputPorts = ports;
        rtkStreamTypes["serial"].available = ports.map((v) => v.comName).join(", ");
    })


    /* Utility functions */
    $scope.hasRestriction = (obj: string[]) => {
        let result = false;
        if (obj) {
            result = obj.length > 0;
        }
        return result;
    };

    function checkMode(newVal?: "ROVER" | "BASE") {
        if (newVal) {
            $scope.currentMode = newVal;
        }
        //$scope.isRover = ($scope.currentMode === 'ROVER');
    };

    $scope.getDefaultPath = (selectedItem: string) => {
        $scope.selectedOutputType = selectedItem;

        if (rtkStreamTypes[selectedItem]) {
            $scope.outputPath = rtkStreamTypes[selectedItem].default;
        }

        //$scope.outputExample
        switch (selectedItem) {
            case "file":
                $scope.outputPath = '$RTKLIBLOGDIR/bas_%Y%m%d%h%M.ubx';
                break;
            case "tcpsvr":
                $scope.outputPath = '2424';
                break;
            case "serial":
                $scope.outputPath = 'ttyUSB0:57600:8:n:1:off';
                break;
        }
        // if(selectedItem === 'file'){
        //     $scope.outputPath = '$RTKLIBLOGDIR/bas_%Y%m%d%h%M.ubx';
        // }else if(selectedItem === 'tcpsvr'){
        //     $scope.outputPath = '2424';
        // }else if(selectedItem === 'serial'){
        //     $scope.outputPath = 'ttyUSB0:57600:8:n:1:off';
        // }
    }

    /* Screen Functionnalities */
    $scope.push = ($event: angular.IAngularEvent) => {



        $event.stopPropagation();

        console.log($scope.currentMode);

        if ($scope.currentMode === 'ROVER') {
            console.log(computeNavSysValue());
            console.log($scope.advancedParams);
        }

        var modalInstance = $modal.open({
            animation: true,
            template: require('../modals/push-conf/push-conf.html'),
            controller: push_conf_controller,
            resolve: {
                mode: () => {
                    return $scope.currentMode;
                },
                requiredParams: () => {
                    return $scope.requiredParams;
                },
                advancedParams: () => {
                    return $scope.advancedParams;
                },
                otherParams: () => {
                    return $scope.otherParams;
                },
                cmdParams: () => {
                    return $scope.cmdParams;
                },
                outputType: () => {
                    return $scope.selectedOutputType;
                },
                outputValue: () => {
                    return $scope.outputPath;
                },
                inputStreams: () => {
                    return $scope.inputStreams;
                },
                outputStreams: () => {
                    return $scope.outputStreams;
                }
            }
        });

        modalInstance.result.then(() => { // returned input on ok
            console.log('Config pushed');
        }, () => {
            console.log('Push config modal dismissed at: ' + new Date());
        });
    };


    $scope.save = ($event: angular.IAngularEvent) => {
        $event.stopPropagation();

        var modalInstance = $modal.open({
            animation: true,
            template: require('../modals/save-conf/save-conf.html'),
            controller: save_conf_controller,
            resolve: {
                requiredParams: () => {
                    return $scope.requiredParams;
                },
                advancedParams: () => {
                    return $scope.advancedParams;
                },
                otherParams: () => {
                    return $scope.otherParams;
                },
                cmdParams: () => {
                    return $scope.cmdParams;
                }
            }
        });

        modalInstance.result.then(() => { // returned input on ok
            console.log('Config saved');
        }, function () {
            console.log('Save config modal dismissed at: ' + new Date());
        });
    };

    $scope.open = ($event: angular.IAngularEvent) => {
        $event.stopPropagation();

        var modalInstance = $modal.open({
            animation: true,
            template: require('../modals/open-conf/open-conf.html'),
            controller: open_conf_controller,
        });

        modalInstance.result.then(() => { // returned input on ok
            console.log('Config opened');
        }, () => {
            console.log('Open config modal dismissed at: ' + new Date());
        });
    };

    $scope.switchConf = () => {
        //console.log('switch');
        //configuration.switchMode();
        $scope.currentMode = ($scope.isRover) ? "ROVER" : "BASE";
        console.log("switching mode", $scope.currentMode);
    };

    $scope.initNavSys = (navSys: IParameter, value: string | number) => {
        return navSys.value <= value;
    }

    $scope.decodeNavSysValue = (navSys: IParameter) => {

        //$scope.navSysParameter = navSys;
        var value = navSys.value;

        var nbNavSys = $scope.listNavSys.length - 1;
        for (var i = nbNavSys; 0 <= i && value !== 0; i--) {
            var currentNavSys = $scope.listNavSys[i] as INavSys;
            if (value >= currentNavSys.value) {
                value = <number>value - currentNavSys.value;
                currentNavSys.selected = true;
            }
        }
    }

    function computeNavSysValue() {
        var navSysValue = 0;
        var nbNavSys = $scope.listNavSys.length;
        for (var i = 0; i < nbNavSys; i++) {
            var currentNavSys = $scope.listNavSys[i];
            if (currentNavSys.selected) {
                navSysValue += currentNavSys.value;
            }
        }
        //$scope.navSysParameter.value = navSysValue;

        return navSysValue;
    }

    /* Loading Process */
    configuration.getFile().then(() => {
        // if (configuration.getMode() === 'BASE') {
        //     configuration.getBaseCmdFile();
        // }
        // configuration.getRunBase();
        console.log("getFile");
    });

};