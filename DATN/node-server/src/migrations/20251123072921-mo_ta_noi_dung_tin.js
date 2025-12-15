'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('tin_tuc','noi_dung',{
      type: Sequelize.TEXT('long'),
      after: "id_dm",
      allowNull:false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tin-tuc', 'noi_dung');
    
  }
};
