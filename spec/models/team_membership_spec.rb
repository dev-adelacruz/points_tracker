# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamMembership do
  describe "#associations" do
    it { is_expected.to belong_to(:team) }
    it { is_expected.to belong_to(:user) }
  end

  describe "#validations" do
    subject { build(:team_membership) }

    it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:team_id) }
  end
end
