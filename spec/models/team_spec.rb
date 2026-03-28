# frozen_string_literal: true

require "rails_helper"

RSpec.describe Team do
  describe "#validations" do
    subject { build(:team) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name) }
  end

  describe "#associations" do
    it { is_expected.to have_many(:team_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:team_memberships) }
  end
end
