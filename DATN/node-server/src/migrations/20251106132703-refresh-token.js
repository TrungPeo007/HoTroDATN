'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'refresh_token', {
      type: Sequelize.STRING,
      comment: "token de tao lai AT moi",
      after: "token_expire"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'refresh_token');
  }
};
