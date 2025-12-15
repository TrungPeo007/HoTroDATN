'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.ENUM('local','google','facebook'),
      after: "vai_tro",
      allowNull:false,
      defaultValue: 'local'
    });
    await queryInterface.addColumn('users', 'provider_id', {
      type: Sequelize.STRING(),
      after: "provider"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'provider');
    await queryInterface.removeColumn('users', 'provider_id');
  }
};
