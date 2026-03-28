# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Admin::SystemSettings" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }

  before do
    SystemSetting.find_or_create_by!(key: "company_coin_target") { |s| s.value = "300000" }
  end

  describe "#update" do
    path "/api/v1/admin/system_settings/{key}" do
      put "updates a system setting" do
        tags "Admin::SystemSettings"
        consumes "application/json"
        produces "application/json"
        parameter name: :key, in: :path, type: :string, required: true
        parameter name: :body, in: :body, schema: {
          type: :object,
          properties: { value: { type: :string } },
          required: %w[value]
        }

        response(200, "updates company_coin_target") do
          let(:key) { "company_coin_target" }
          let(:body) { { value: "500000" } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:key]).to eq("company_coin_target")
            expect(json_response[:data][:value]).to eq("500000")
            expect(SystemSetting.get("company_coin_target")).to eq("500000")
          end
        end

        response(422, "rejects unknown key") do
          let(:key) { "unknown_setting" }
          let(:body) { { value: "123" } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for non-admin") do
          let(:key) { "company_coin_target" }
          let(:body) { { value: "500000" } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
