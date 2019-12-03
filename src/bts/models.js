/*
 * Copyright (c) 2019 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var urlencode = require('urlencode');

/**
 * 列
 * @class
 */
class Cell {
    constructor() {
        /**
         * 列名，命名规则满足正则[a-zA-Z_][a-za-z0-9\_]{0,254}
         * @type {string | null}
         */
        this.column = null;

        /**
         * 列值 rawurlencode后的string
         * @type {string | null}
         */
        this.value = null;
    }

}

/**
 * 行
 * @class
 */
class Row {
    constructor() {
        /**
         * 行主键,需要urlencode
         * @type{string | null}
         */
        this.rowkey = null;

        /**
         * cells 每个column, value对的列表
         * @type{Array.Cell | null}
         */
        this.cells = null;
    }

    encode(rowKey) {
        return urlencode(rowKey);
    }

    addCells(column, value = null) {
        this.cells = this.cells || [];
        var newCell = new Cell();
        newCell.column = column;
        if (value !== null) {
            newCell.value = urlencode(value);
        }
        this.cells.push(newCell);
    }
}

/**
 * CreateInstance请求参数结构体
 * @class
 */
class CreateInstanceRequest {
    constructor() {
        /**
         * 实例默认存储类型,仅支持HighPerformance和CommonPerformance
         * @type {string | null}
         */
        this.storageType = null;
    }
}

/**
 * CreateTable请求参数结构体
 * @class
 */
class CreateTableRequest {
    constructor() {
        /**
         * 建表时固定传0，非0值代表更新表信息。如果不传body，默认为建表
         * @type {number | null}
         */
        this.tableVersion = 0;

        /**
         * 数据压缩方式，可取以下值："NONE"不压缩 "SNAPPY_ALL"使用snappy压缩 ,默认为NONE
         * @type {string | null}
         */
        this.compressType = null;

        /**
         * 数据过期时间，为0时永不过期，单位秒。默认为0，即永不过期
         * @type {number | null}
         */
        this.ttl = null;

        /**
         * 表存储类型,仅支持HighPerformance和CommonPerformance，若无此参数则默认使用Instance中定义的表存储类型
         * @type {string | null}
         */
        this.storageType = null;

        /**
         * 最多保留版本数，取值范围[1, 50000]
         * @type {number | null}
         */
        this.maxVersions = null;
    }
}

/**
 * UpdateTable请求参数结构体
 * @class
 */
class UpdateTableRequest {
    constructor() {
        /**
         * 必须先通过GET 获取表的版本信息后，再带入此次请求
         * @type {number | null}
         */
        this.tableVersion = null;

        /**
         * 数据压缩方式，可取以下值："NONE"不压缩 "SNAPPY_ALL"使用snappy压缩 ,默认为NONE
         * @type {string | null}
         */
        this.compressType = null;

        /**
         * 数据过期时间，为0时永不过期，单位秒。默认为0，即永不过期
         * @type {number | null}
         */
        this.ttl = null;

        /**
         * 最多保留版本数，取值范围[1, 50000]
         * @type {number | null}
         */
        this.maxVersions = null;
    }
}

/**
 * PutRow请求参数结构体
 * @class
 */
class PutRowRequest {
    constructor() {
        /**
         * 行主键，需要rawurlencode
         * @type {string | null}
         */
        this.rowkey = null;

        /**
         * 每个column,value对的列表
         * @type {Array.<Cell> | null}
         */
        this.cells = null;
    }

    addCells(column, value) {
        this.cells = this.cells || [];
        var newCell = new Cell();
        newCell.column = column;
        newCell.value = urlencode(value);
        this.cells.push(newCell);
    }

    encode(rowKey) {
        return urlencode(rowKey)
    }

}

/**
 * BatchPutRowRequest 请求体
 * @class
 */
class BatchPutRowRequest {
    constructor() {
        /**
         * rows
         * @type{Array.<Row> | null}
         */
        this.rows = null;
    }

    addRows(rowkey, column, value) {
        this.rows = this.rows || [];
        var newRow = new Row();
        newRow.addCells(column, value);
        newRow.rowkey = newRow.encode(rowkey);
        this.rows.push(newRow);
    }
}

/**
 *  DeleteRowRequest 请求体
 *  @class
 */
class DeleteRowRequest {
    constructor() {
        /**
         * 行主键，需要urlencode
         * @type{string | null}
         */
        this.rowkey = null;

        /**
         * 待删除的column列表
         * @type{Array.<Cell> | null}
         */
        this.cells = null;
    }

    encode(rowKey) {
        return urlencode(rowKey);
    }

    addCells(column = null) {
        this.cells = this.cells || [];
        if (column != null) {
            var newCell = new Cell();
            newCell.column = urlencode(column);
            this.cells.push(newCell);
        }
    }

}

/**
 * BatchDeleteRowRequest 请求体
 * @class
 */
class BatchDeleteRowRequest {
    constructor() {
        /**
         * rows
         * @type{Array.<Row> | null}
         */
        this.rows = null;
    }

    addRows(rowkey, column) {
        this.rows = this.rows || [];
        var newRow = new Row();
        newRow.addCells(column);
        newRow.rowkey = newRow.encode(rowkey);
        this.rows.push(newRow);
    }
}

/**
 *  GetRowRequest 请求体
 *  @class
 */
class GetRowRequest {
    constructor() {
        /**
         * 行主键， 需要rawurlencode
         * @type {string | null}
         */
        this.rowkey = null;

        /**
         * 待查询的column列表
         * @type {Array.<Cell> | null}
         */
        this.cells = null;
    }

    encode(rowKey) {
        return urlencode(rowKey);
    }

    addCells(column = null) {
        this.cells = this.cells || [];
        if (column != null) {
            var newCell = new Cell();
            newCell.column = column;
            this.cells.push(newCell);
        }
    }
}

/**
 * BatchGetRowRequest 请求体
 * @class
 */
class BatchGetRowRequest {
    constructor() {
        /**
         * rows
         * @type {Array.<Row> | null}
         */
        this.rows = null;
    }

    addRows(rowkey, column = null) {
        this.rows = this.rows || [];
        var newRow = new Row();
        if (column !== null) {
            newRow.addCells(column);
        }
        newRow.rowkey = newRow.encode(rowkey);
        this.rows.push(newRow);
    }
}

/**
 * ScanRequest 请求体
 * @class
 */
class ScanRequest {
    constructor() {
        /**
         * scan的起始rowkey，需rawurlencode，不填时默认为表的第一个rowkey
         * @type {string | null}
         */
        this.startRowkey = null;

        /**
         * 是否包含起始rowkey，默认包含
         * @type {bool | null}
         */
        this.includeStart = true;

        /**
         * scan的终止rowkey，需rawurlencode，不填时默认为表的最后一个rowkey
         * @type {string | null}
         */
        this.stopRowkey = null;

        /**
         * 是否包含终止rowkey，默认不包含
         * @type {bool | null}
         */
        this.includeStop = false;

        /**
         * 待查询的column列表，不写默认返回全部列
         * @type{Array<Cell> | null}
         */
        this.selector = null;

        /**
         * 限定查询行数，其值必须为整型，设为其他类型无效
         * @type{int | null}
         */
        this.limit = null;
    }

    encode(rowKey) {
        return urlencode(rowKey);
    }

    addCells(column = null) {
        this.selector = this.selector || [];
        if (column != null) {
            var newCell = new Cell();
            newCell.column = column;
            this.selector.push(newCell);
        }
    }
}

module.exports = {
    Cell: Cell,
    Row: Row,
    CreateInstanceRequest: CreateInstanceRequest,
    CreateTableRequest: CreateTableRequest,
    UpdateTableRequest: UpdateTableRequest,
    PutRowRequest: PutRowRequest,
    BatchPutRowRequest: BatchPutRowRequest,
    DeleteRowRequest: DeleteRowRequest,
    BatchDeleteRowRequest: BatchDeleteRowRequest,
    GetRowRequest: GetRowRequest,
    BatchGetRowRequest: BatchGetRowRequest,
    ScanRequest: ScanRequest,
};