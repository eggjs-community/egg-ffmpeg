module.exports = app => {
  class RestqlService extends app.Service {
    * index(modal,query,condition={}) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];

      const offset = query.page?(parseInt(query.page)-1)*parseInt(query.pageSize):0;
      const limit = query.pageSize?parseInt(query.pageSize):10000;
      
      console.log(modalDb,limit,offset);
      
      const sortField = query.sortField?query.sortField:modalId;
      const sortOrder = query.sortOrder?query.sortOrder:'asc';
      const record = yield this.app.mysql.select(modalDb, { 
        where:condition,
        orders: [[sortField,sortOrder]],
        limit,offset,
      });
      let conditionstr = "";
      if (JSON.stringify(condition) != "{}") {
        conditionstr = " where ";
        for (const key in condition) {
          if ( (typeof condition[key]=='string')&&condition[key].constructor==String) {
            conditionstr = conditionstr + key + " = '" + condition[key] + "' and ";
          }else if((typeof condition[key]=='number')&&condition[key].constructor==Number){
            conditionstr = conditionstr + key + " = " + condition[key] + ' and ';
          }
        }
        conditionstr = conditionstr.substring(0,conditionstr.lastIndexOf(' and '));
      };
      const totalsql = 'select count(*) as total from ' + modalDb + conditionstr;
      const totalRecord = yield this.app.mysql.query(totalsql);
      return {record,totalRecord:totalRecord[0].total};
    }
    * show(modal,params) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];
      let condition = {};
      condition[modalId] = params.id;
      let record =  yield this.app.mysql.get(modalDb, condition);
      return record;
    }
    * update(modal,id,request) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];
      let upstr = `update ${modalDb} set `;
      let upEscape = [];
      for (const key in request) {
        if (upEscape.length!=0) {upstr+=', ';};
        upstr+=`${key} = ?`;
        upEscape.push(request[key]);
      }
      upstr += ` where ${modalId} = ?`;
        console.log(upstr);
      upEscape.push(id);
      let result =  yield app.mysql.query(upstr, upEscape);
      return result;
    }
    * create(modal,request) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      let result = "";
      try {
        result = yield this.app.mysql.insert(modalDb, request);
      } catch (err) {
        result = err.message;
      }
      return result;
    }
    * destroy(modal,params) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];
      const ids = params.id.split(',');
      let condition = {};
      condition[modalId] = ids;
      const result = yield this.app.mysql.delete(modalDb,condition);
      return result;
    }
    * preOne(modal,params,condition={},query={}) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];

      const sortField = query.sortField?query.sortField:modalId;
      const sortOrder = query.sortOrder?query.sortOrder:'asc';

// select * from web_news where nid < 8 order by nid desc limit 1
      let queryStr = `select * from ${modalDb} where ${sortField} > (select ${sortField} from ${modalDb} where ${modalId} = ?)`;
      let conditionstr='';
      if (JSON.stringify(condition) != "{}") {
        for (const key in condition) {
          conditionstr = conditionstr + ' and ' + key + " = " + condition[key];
        }
      }
      queryStr = queryStr + `${conditionstr}  order by ${sortField} asc limit 1 `;
      let sqlEscape = [params.id];
        console.log(queryStr);
      let result =  yield app.mysql.query(queryStr, sqlEscape);
      return result;
    }
    * nextOne(modal,params,condition={},query={}) {
      const modalDb = this.app.config.dataConfig[`${modal}Db`];
      const modalId = this.app.config.dataConfig[`${modal}Id`];

      const sortField = query.sortField?query.sortField:modalId;
      const sortOrder = query.sortOrder?query.sortOrder:'asc';

// select * from web_news where nid > 8 order by nid ASC limit 1
      let queryStr = `select * from ${modalDb} where ${sortField} < (select ${sortField} from ${modalDb} where ${modalId} = ?)`;
      let conditionstr='';
      if (JSON.stringify(condition) != "{}") {
        for (const key in condition) {
          conditionstr = conditionstr + ' and ' + key + " = " + condition[key];
        }
      }
      queryStr = queryStr + `${conditionstr}  order by ${sortField} desc limit 1 `;
      console.log(queryStr);
      let sqlEscape = [params.id];
      let result =  yield app.mysql.query(queryStr, sqlEscape);
      return result;
    }
  }
  return RestqlService;
};