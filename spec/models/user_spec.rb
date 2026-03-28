# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User do
  describe '#validations' do
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:role) }
  end

  describe '#role' do
    it 'defaults to host' do
      user = build(:user)
      expect(user.role).to eq('host')
    end

    it { is_expected.to define_enum_for(:role).with_values(admin: 0, emcee: 1, host: 2) }

    it 'rejects invalid roles' do
      user = build(:user)
      user.role = 99
      expect(user).not_to be_valid
    end
  end
end
